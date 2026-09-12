#!/usr/bin/env python3
"""
PowerPoint (.pptx) 一括 PDF 変換スクリプト (macOS 専用)
作業フォルダ内の .pptx ファイルを検出し、Microsoft PowerPoint を利用して
高品質な PDF ファイルを slides/ フォルダに出力します。
Web公開用に安全なファイル名（URLフレンドリー名）も同時に生成します。
"""

import os
import sys
import shutil
import subprocess
import re
from pathlib import Path

WORKSPACE_DIR = Path(__file__).resolve().parent.parent
SLIDES_DIR = WORKSPACE_DIR / "slides"

def get_clean_name(filename: str) -> str:
    """Web配信用に記号や日本語を正規化したファイル名を生成"""
    name = Path(filename).stem
    # #001_日本語の文字と発音 -> 001_japanese_writing または 001_nihongo
    # 簡単なマッピング
    mapping = {
        "#001_日本語の文字と発音": "001_japanese_writing",
        "#001_01_日本語の文字と発音": "001_01_japanese_writing",
        "#001_02_日本語の文字と発音_FC": "001_02_japanese_writing_fc",
        "#002_01_Lesson1_あいさつ": "002_01_lesson1_aisatsu",
        "#002_02_Lesson1_あいさつ_FC": "002_02_lesson1_aisatsu_fc",
        "#002_03_Lesson1_charts": "002_03_lesson1_charts",
    }
    if name in mapping:
        return mapping[name] + ".pdf"
    
    # charts パターンの自動検出: #00X_03_LessonX_charts -> 00x_03_lessonx_charts.pdf
    chart_match = re.match(r'^[#＃]?(\d{3})_03_([Ll]esson\d+)_charts$', name, re.IGNORECASE)
    if chart_match:
        return f"{chart_match.group(1)}_03_{chart_match.group(2).lower()}_charts.pdf"

    # 汎用ルール: # を除去、スペースやハイフンをアンダースコアに
    clean = re.sub(r'^[#＃]', '', name)
    clean = re.sub(r'[\s\-]+', '_', clean)
    return clean + ".pdf"

def pptx_to_pdf(pptx_path: Path, output_pdf_path: Path) -> bool:
    """PowerPoint の AppleScript を使って pptx を pdf に変換する"""
    pptx_posix = str(pptx_path.resolve())
    pdf_posix = str(output_pdf_path.resolve())
    
    applescript = f'''
set pptxPath to POSIX file "{pptx_posix}"
set pdfPath to POSIX file "{pdf_posix}"

tell application "Microsoft PowerPoint"
    open pptxPath
    delay 1.5
    tell active presentation
        save in pdfPath as save as PDF
        close saving no
    end tell
end tell
'''
    try:
        res = subprocess.run(
            ["osascript", "-e", applescript],
            capture_output=True,
            text=True,
            check=False
        )
        if res.returncode == 0 and output_pdf_path.exists():
            return True
        else:
            print(f"  [エラー] osascript 出力: {res.stderr.strip() or res.stdout.strip()}")
            return False
    except Exception as e:
        print(f"  [例外発生] {e}")
        return False

def main():
    print("=" * 60)
    print("  PowerPoint (.pptx) → PDF 一括変換ツール")
    print("=" * 60)
    
    SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    
    pptx_files = sorted([
        f for f in WORKSPACE_DIR.glob("*.pptx")
        if not f.name.startswith("~$")
    ])
    
    if not pptx_files:
        print("変換対象の .pptx ファイルが見つかりませんでした。")
        return
    
    print(f"見つかった PPTX ファイル数: {len(pptx_files)} 件\n")
    
    success_count = 0
    for i, pptx_file in enumerate(pptx_files, 1):
        original_pdf_name = pptx_file.stem + ".pdf"
        output_pdf = SLIDES_DIR / original_pdf_name
        clean_pdf_name = get_clean_name(pptx_file.name)
        clean_pdf = SLIDES_DIR / clean_pdf_name
        
        print(f"[{i}/{len(pptx_files)}] 変換中: {pptx_file.name}")
        print(f"       → 原本名: slides/{original_pdf_name}")
        
        success = pptx_to_pdf(pptx_file, output_pdf)
        if success:
            file_size_kb = output_pdf.stat().st_size / 1024
            print(f"       ✓ 変換成功 ({file_size_kb:.1f} KB)")
            
            # URLフレンドリー名も作成
            if clean_pdf.resolve() != output_pdf.resolve():
                shutil.copyfile(output_pdf, clean_pdf)
                print(f"       ✓ Web用コピー作成: slides/{clean_pdf_name}")
            
            success_count += 1
        else:
            print(f"       ✗ 失敗しました。PowerPoint が正常に動作しているか確認してください。")
    
    print("\n" + "=" * 60)
    print(f"変換完了: {success_count} / {len(pptx_files)} 件 成功")
    print(f"保存先: {SLIDES_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()

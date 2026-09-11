#!/usr/bin/env python3
"""
高品質スタジオ音声（Microsoft Neural Voice ja-JP-NanamiNeural）を一括生成するスクリプト
全289スライドのMP3音源を生成し、js/speech-data.js に audio プロパティを紐付けます。
"""

import asyncio
import json
import os
import re
import edge_tts

# 読み上げテキストの最適化（Kanji/表記揺れのふりがな確定）
READING_FIXES = {
    '四月': 'しがつ',
    '七月': 'しちがつ',
    '九月': 'くがつ',
    '一月': 'いちがつ',
    '二月': 'にがつ',
    '三月': 'さんがつ',
    '五月': 'ごがつ',
    '六月': 'ろくがつ',
    '八月': 'はちがつ',
    '十月': 'じゅうがつ',
    '十一月': 'じゅういちがつ',
    '十二月': 'じゅうにがつ',
    '四時': 'よじ',
    '七時': 'しちじ',
    '九時': 'くじ',
    '一時': 'いちじ',
    '二時': 'にじ',
    '三時': 'さんじ',
    '五時': 'ごじ',
    '六時': 'ろくじ',
    '八時': 'はちじ',
    '十時': 'じゅうじ',
    '十一時': 'じゅういちじ',
    '十二時': 'じゅうにじ',
    '一': 'いち',
    '二': 'に',
    '三': 'さん',
    '四': 'よん',
    '五': 'ご',
    '六': 'ろく',
    '七': 'なな',
    '八': 'はち',
    '九': 'きゅう',
    '十': 'じゅう',
    '百': 'ひゃく',
    '私たち': 'わたしたち',
    'あなたたち': 'あなたたち',
    '彼': 'かれ',
    '彼女': 'かのじょ',
    '日本人': 'にほんじん',
    'アメリカ人': 'アメリカじん',
    'オーストラリア人': 'オーストラリアじん',
    '中国人': 'ちゅうごくじん',
    '(3)   Watashi wa Seeko de wa ari-masen.': 'わたしはせいこではありません。',
    '(4)   Watashi wa Nihon-jin de wa ari-masen.': 'わたしはにほんじんではありません。',
    'P.   Hai, Seeko desu.': 'はい、せいこです。',
    'Zero   ·   Ichi   ·   Ni   ·   San   ·   Yon   ·   Go': 'ゼロ、いち、に、さん、よん、ご',
    'Ichi-gatsu  (1)  →  January': 'いちがつ',
    'Ichi-ji  (1)  →  1 o\'clock': 'いちじ',
    'Ohayoo gozai-masu   ·   Konnichiwa   ·   Konbanwa': 'おはようございます。こんにちは。こんばんは。'
}

def clean_for_speech(text):
    text = text.strip()
    if text in READING_FIXES:
        return READING_FIXES[text]
    for k, v in READING_FIXES.items():
        if k in text and len(k) >= 2:
            text = text.replace(k, v)
    # 余分なドットや記号の整理
    text = re.sub(r'\s+', ' ', text)
    return text

async def generate_single_audio(sem, text, out_path, voice='ja-JP-NanamiNeural'):
    async with sem:
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            return
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        try:
            comm = edge_tts.Communicate(text, voice)
            await comm.save(out_path)
        except Exception as e:
            print(f"Error generating {out_path} for '{text}': {e}")

async def main():
    workspace = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    speech_js = os.path.join(workspace, 'js', 'speech-data.js')

    with open(speech_js, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r'var SPEECH_DATA = (\{.*?\});\n\nif', content, re.DOTALL)
    if not m:
        raise ValueError("Could not parse SPEECH_DATA from js/speech-data.js")

    data = json.loads(m.group(1))
    sem = asyncio.Semaphore(6)
    tasks = []

    folder_map = {
        "slides/001_01_japanese_writing.pdf": "001_01",
        "slides/001_02_japanese_writing_fc.pdf": "001_02",
        "slides/002_01_lesson1_aisatsu.pdf": "002_01",
        "slides/002_02_lesson1_aisatsu_fc.pdf": "002_02"
    }

    total_count = 0
    for pdf_key, slides in data.items():
        subfolder = folder_map.get(pdf_key, "misc")
        for p_str, item in slides.items():
            page_num = int(p_str)
            raw_text = item.get('kana') or item.get('romaji') or ''
            speech_text = clean_for_speech(raw_text)
            
            filename = f"slide_{page_num:03d}.mp3"
            rel_path = f"audio/{subfolder}/{filename}"
            abs_path = os.path.join(workspace, rel_path)
            
            item['audio'] = rel_path
            total_count += 1
            tasks.append(generate_single_audio(sem, speech_text, abs_path))

    print(f"Generating studio-quality audio for {total_count} slides using ja-JP-NanamiNeural...")
    await asyncio.gather(*tasks)
    print("All audio files generated successfully!")

    # Update speech-data.js
    new_js = f"""/**
 * 日本語音声発音データ辞書 (高品位ニューラルMP3音源 & Web Speech API 対応)
 * 自動生成スクリプト: scripts/generate_neural_audio.py
 */

var SPEECH_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};

if (typeof window !== "undefined") {{
  window.SPEECH_DATA = SPEECH_DATA;
}}
if (typeof globalThis !== "undefined") {{
  globalThis.SPEECH_DATA = SPEECH_DATA;
}}
"""

    with open(speech_js, 'w', encoding='utf-8') as f:
        f.write(new_js)

    print(f"Successfully updated {speech_js} with audio paths.")

if __name__ == '__main__':
    asyncio.run(main())

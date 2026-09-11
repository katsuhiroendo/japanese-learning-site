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

# スライド単位の正確な発音テキスト指定（同音異義語・アクセント確定用）
# 例: '001_02' の 4ページ: 'oi' (nephew) は「甥」（低-高の平板アクセント）
SLIDE_TEXT_OVERRIDES = {
    ('001_02', 4): '甥',       # oi (nephew) -> 低-高 (平板アクセント)
    ('001_02', 11): '価格',    # kakaku (price) -> ka↓ ka↑ ku↑ (平板アクセント)
    ('001_02', 12): 'ケーキ',  # keeki (cake) -> ke↑ e↓ ki↓ (頭高アクセント)
    ('001_02', 15): '教会',    # kyookai (church) -> kyo↓ o↑ ka↑ i↑ (平板アクセント)
    ('001_02', 17): '吸う。',  # suu (to smoke) -> su↓ u↑ (動詞終止形・平板アクセント)
    ('001_02', 19): '少し。',  # sukoshi (a little) -> su↓ ko↑ shi↓ (中高アクセント)
    ('001_02', 46): 'ヒュー・ヒュー', # hyuuhyuu (wind sound) -> hyu↑ u↓ hyu↓ u↓ (頭高アクセント)
    ('001_02', 47): '評価',       # hyooka (evaluation) -> hyo↑ o↓ ka↓ (頭高アクセント)
    ('001_02', 48): '豆！',       # mame (bean) -> ma↓ me↑ (低-高アクセント確定)
    ('001_02', 50): '桃',         # momo (peach) -> mo↓ mo↑ (平板アクセント)
    ('001_02', 53): '目標',       # mokuhyoo (aim) -> mo↓ ku↑ hyo↑ o↑ (平板アクセント)
    ('001_02', 54): '脈',         # myaku (pulse) -> may↓ ku↑ (平板アクセント)
    ('001_02', 58): '欲',         # yoku (desire) -> yho↓ ku↑ (平板アクセント)
    ('001_02', 59): '雇う',       # yatou (to employ) -> ya↓ to↑ u↓ (中高アクセント)
    ('001_02', 64): 'ラク',       # raku (easy) -> ra↓ ku↑ (低-高平板アクセント確定)
    ('001_02', 66): '留守',       # rusu (absence) -> ru↑ su↓ (頭高アクセント)
    ('001_02', 68): '六',         # roku (six) -> ro↓ ku↑ (平板アクセント)
    ('001_02', 75): '割り当て',   # wariate (assignment) -> wa↓ ri↑ a↑ te↑ (平板アクセント)
    ('001_02', 76): '割り当てる', # wariateru (to allot) -> wa↓ ri↑ a↑ te↑ ru↓ (中高アクセント)
    ('001_02', 83): '逆',         # gyaku (contrary) -> gya↓ ku↑ (平板アクセント)
    ('001_02', 86): '在庫',       # zaiko (stock) -> za↓ i↑ ko↑ (平板アクセント)
    ('001_02', 87): '事務所',     # jimusho (office) -> ji↓ mu↑ sho↓ (中高アクセント)
    ('001_02', 93): '定規',       # joogi (ruler) -> jo↑ o↓ gi↓ (頭高アクセント)
    ('001_02', 94): '出汁',       # dashi (soup stock) -> da↓ shi↑ (平板アクセント)
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

    # 音声生成対象はフラッシュカードのみ
    folder_map = {
        "slides/001_02_japanese_writing_fc.pdf": "001_02",
        "slides/002_02_lesson1_aisatsu_fc.pdf": "002_02"
    }

    total_count = 0
    for pdf_key, slides in data.items():
        subfolder = folder_map.get(pdf_key, "misc")
        for p_str, item in slides.items():
            page_num = int(p_str)
            raw_text = item.get('kana') or item.get('romaji') or ''
            if (subfolder, page_num) in SLIDE_TEXT_OVERRIDES:
                speech_text = SLIDE_TEXT_OVERRIDES[(subfolder, page_num)]
            else:
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

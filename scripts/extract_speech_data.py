#!/usr/bin/env python3
"""
スライド資料から日本語発音データを抽出し、js/speech-data.js を生成するスクリプト
"""

import json
import os
import re
from pptx import Presentation

# 基本モーラ（ローマ字 -> ひらがな）マップ
MORA_MAP = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
}

def mora_to_kana(m):
    m = m.lower().strip()
    if m in MORA_MAP:
        return MORA_MAP[m]
    # 促音 (っ) の処理: tto, kki, ssu, etc.
    if len(m) >= 2 and m[0] == m[1] and m[0] not in 'aeioun':
        rest = m[1:]
        if rest in MORA_MAP:
            return 'っ' + MORA_MAP[rest]
    return m

def extract_001_fc(filepath):
    prs = Presentation(filepath)
    data = {}
    for i, slide in enumerate(prs.slides):
        texts = [shape.text.strip() for shape in slide.shapes if shape.has_text_frame and shape.text.strip()]
        if not texts:
            continue
        romaji = texts[0]
        meaning = texts[1] if len(texts) > 1 else ''
        moras = texts[2:]
        kana = ''.join(mora_to_kana(m) for m in moras) if moras else romaji
        data[i + 1] = {
            'romaji': romaji,
            'kana': kana,
            'en': meaning
        }
    return data

def extract_002_fc(filepath):
    prs = Presentation(filepath)
    data = {}
    for i, slide in enumerate(prs.slides):
        texts = [shape.text.strip() for shape in slide.shapes if shape.has_text_frame and shape.text.strip()]
        if not texts:
            continue

        # ヘッダー行を除去
        content_texts = [t for t in texts if not t.startswith('Lesson 1')]
        if not content_texts:
            data[i + 1] = {
                'romaji': 'AISATSU',
                'kana': 'あいさつ',
                'en': 'Greetings'
            }
            continue

        romaji = content_texts[0]
        en = content_texts[1] if len(content_texts) > 1 else ''
        jp = content_texts[2] if len(content_texts) > 2 else ''

        # ドリル文スライド（✓ と ✕）
        if content_texts[0] == '✓':
            pos = content_texts[1] if len(content_texts) > 1 else ''
            neg = content_texts[3] if len(content_texts) > 3 else ''
            romaji = f"{pos} / {neg}"
            
            # ドリル文のひらがな化
            kana_text = pos.replace('Watashi wa', 'わたしは')\
                           .replace('Watashi-tachi wa', 'わたしたちは')\
                           .replace('Anata wa', 'あなたは')\
                           .replace('Anata-tachi wa', 'あなたたちは')\
                           .replace('Kare wa', 'かれは')\
                           .replace('Kanojo wa', 'かのじょは')\
                           .replace('Jon', 'ジョン')\
                           .replace('Seeko', 'せいこ')\
                           .replace('Nihon-jin', 'にほんじん')\
                           .replace('Amerika-jin', 'アメリカじん')\
                           .replace('Oosutoraria-jin', 'オーストラリアじん')\
                           .replace('Chuugoku-jin', 'ちゅうごくじん')\
                           .replace('de wa ari-masen', 'ではありません')\
                           .replace('desu', 'です')
            kana = kana_text
            en = 'Substitution Drill'
        elif '?' in romaji:
            # 疑問文・応答文スライド
            q = romaji
            ans_pos = content_texts[2] if len(content_texts) > 2 else ''
            ans_neg = content_texts[4] if len(content_texts) > 4 else ''
            
            kana = q.replace('Anata wa', 'あなたは')\
                    .replace('Jon-san', 'ジョンさん')\
                    .replace('Nihon-jin', 'にほんじん')\
                    .replace('Amerika-jin', 'アメリカじん')\
                    .replace('Oosutoraria-jin', 'オーストラリアじん')\
                    .replace('Chuugoku-jin', 'ちゅうごくじん')\
                    .replace('desu ka?', 'ですか？')
            if ans_pos:
                kana += " " + ans_pos.replace('Hai,', 'はい、').replace('Jon', 'ジョン').replace('Nihon-jin', 'にほんじん').replace('Amerika-jin', 'アメリカじん').replace('Oosutoraria-jin', 'オーストラリアじん').replace('Chuugoku-jin', 'ちゅうごくじん').replace('desu.', 'です。')
            en = 'Question & Answer Drill'
        elif jp:
            kana = jp
        else:
            kana = romaji

        data[i + 1] = {
            'romaji': romaji,
            'kana': kana,
            'en': en
        }
    return data

def get_002_main_speech():
    """Lesson #002 本編スライド (36p) 用の発音データ辞書"""
    return {
        1: {"romaji": "AISATSU", "kana": "あいさつ", "en": "greetings"},
        2: {"romaji": "Ohayoo gozai-masu. Konnichiwa. Konbanwa. Oyasumi nasai. Sayoonara.", "kana": "おはようございます。こんにちは。こんばんは。おやすみなさい。さようなら。", "en": "Five everyday greetings"},
        3: {"romaji": "Konnichiwa. Hajimemashite. Watashi wa Seeko desu. Doozo yoroshiku.", "kana": "こんにちは。はじめまして。わたしはせいこです。どうぞよろしく。", "en": "Conversation (1/2)"},
        4: {"romaji": "Jon desu. Doozo yoroshiku. Anata wa Nihon-jin desu ka? Hai, Nihon-jin desu. Jon-san wa Amerika-jin desu ka? Iie, Amerika-jin de wa ari-masen. Oosutoraria-jin desu.", "kana": "ジョンです。どうぞよろしく。あなたはにほんじんですか？はい、にほんじんです。ジョンさんはアメリカじんですか？いいえ、アメリカじんではありません。オーストラリアじんです。", "en": "Conversation (2/2)"},
        5: {"romaji": "hajimemashite, watashi, Seeko, desu, doozo yoroshiku, Jon, anata, Nihon-jin, Amerika-jin, Oosutoraria-jin", "kana": "はじめまして、わたし、せいこ、です、どうぞよろしく、ジョン、あなた、にほんじん、アメリカじん、オーストラリアじん", "en": "New Vocabulary"},
        6: {"romaji": "Kaisetsu", "kana": "かいせつ", "en": "Explanations"},
        7: {"romaji": "Konnichiwa. O-genki desu ka? Hai, genki desu.", "kana": "こんにちは。おげんきですか？はい、げんきです。", "en": "Hello. How are you?"},
        8: {"romaji": "Hajimemashite.", "kana": "はじめまして。", "en": "How do you do?"},
        9: {"romaji": "Hajimemashite. Doozo yoroshiku.", "kana": "はじめまして。どうぞよろしく。", "en": "Nice to meet you."},
        10: {"romaji": "Honda-san, Kazuo-san, Honda Kazuo-san", "kana": "ほんださん、かずおさん、ほんだかずおさん", "en": "-San (honorific title)"},
        11: {"romaji": "Bumpoo", "kana": "ぶんぽう", "en": "Grammar"},
        12: {"romaji": "Watashi wa Seeko desu. Jon-san wa Oosutoraria-jin desu.", "kana": "わたしはせいこです。ジョンさんはオーストラリアじんです。", "en": "Word Order (Predicate at end)"},
        13: {"romaji": "Watashi wa Seeko desu. Anata wa Amerika-jin desu ka?", "kana": "わたしはせいこです。あなたはアメリカじんですか？", "en": "Word Order: Verbs don't change"},
        14: {"romaji": "Watashi wa Jon desu. Seeko-san wa Nihon-jin desu.", "kana": "わたしはジョンです。せいこさんはにほんじんです。", "en": "Particle 'Wa' (Topic)"},
        15: {"romaji": "Watashi wa Nihon-jin de wa ari-masen. Jon-san wa Amerika-jin de wa ari-masen.", "kana": "わたしはにほんじんではありません。ジョンさんはアメリカじんではありません。", "en": "Negative: de wa ari-masen"},
        16: {"romaji": "Anata wa Amerika-jin desu ka? Seeko-san wa Nihon-jin desu ka?", "kana": "あなたはアメリカじんですか？せいこさんはにほんじんですか？", "en": "Particle 'Ka' (Question)"},
        17: {"romaji": "Renshuu mondai", "kana": "れんしゅうもんだい", "en": "Exercises"},
        18: {"romaji": "Watashi wa Jon desu. Watashi wa Jon de wa ari-masen.", "kana": "わたしはジョンです。わたしはジョンではありません。", "en": "Exercise 1 (1) & (3)"},
        19: {"romaji": "Watashi-tachi wa Nihon-jin desu. Anata-tachi wa Nihon-jin desu.", "kana": "わたしたちはにほんじんです。あなたたちはにほんじんです。", "en": "Exercise 1 (2) & (4)"},
        20: {"romaji": "Anata wa Seeko-san desu ka? Hai, Seeko desu. Iie, Seeko de wa ari-masen.", "kana": "あなたはせいこさんですか？はい、せいこです。いいえ、せいこではありません。", "en": "Exercise 1 (5) + Exercise 2"},
        21: {"romaji": "Watashi wa Nihon-jin desu. Seeko-san wa Amerika-jin de wa ari-masen.", "kana": "わたしはにほんじんです。せいこさんはアメリカじんではありません。", "en": "Exercise 3 (Repetition)"},
        22: {"romaji": "Anata wa Oosutoraria-jin desu. Jon-san wa Oosutoraria-jin desu.", "kana": "あなたはオーストラリアじんです。ジョンさんはオーストラリアじんです。", "en": "Exercise 4 (1)"},
        23: {"romaji": "Anata wa Amerika-jin desu ka? Seeko-san wa Amerika-jin desu ka?", "kana": "あなたはアメリカじんですか？せいこさんはアメリカじんですか？", "en": "Exercise 4 (2)"},
        24: {"romaji": "Watashi wa Chuugoku-jin de wa ari-masen.", "kana": "わたしはちゅうごくじんではありません。", "en": "Exercise 4 (3)"},
        25: {"romaji": "Watashi wa Chuugoku-jin desu. Jon-san wa Chuugoku-jin desu.", "kana": "わたしはちゅうごくじんです。ジョンさんはちゅうごくじんです。", "en": "Exercise 4 (4)"},
        26: {"romaji": "Ohayoo gozai-masu. Hajimemashite. Watashi wa Seeko desu. Doozo yoroshiku.", "kana": "おはようございます。はじめまして。わたしはせいこです。どうぞよろしく。", "en": "Exercise 5 (Self-introduction)"},
        27: {"romaji": "ohayoo gozai-masu, konnichiwa, konbanwa, oyasumi nasai, sayoonara, watashi, anata, Jon-san, Seeko-san, Nihon-jin", "kana": "おはようございます、こんにちは、こんばんは、おやすみなさい、さようなら、わたし、あなた、ジョンさん、せいこさん、にほんじん", "en": "Pronunciation Drill A"},
        28: {"romaji": "Watashi wa Nihon-jin desu. Jon-san wa Oosutoraria-jin desu. Watashi wa Nihon-jin de wa ari-masen.", "kana": "わたしはにほんじんです。ジョンさんはオーストラリアじんです。わたしはにほんじんではありません。", "en": "Pronunciation Drill B"},
        29: {"romaji": "Bangai-hen: suuji, tsuki, jikoku", "kana": "ばんがいへん：すうじ、つき、じこく", "en": "Extra Study: Numbers, months, and time"},
        30: {"romaji": "ichi, ni, san, shi, go, roku, shichi, hachi, kyuu, juu, hyaku", "kana": "いち、に、さん、し、ご、ろく、しち、はち、きゅう、じゅう、ひゃく", "en": "Numbers 1-10 & 100"},
        31: {"romaji": "ichi-gatsu, ni-gatsu, san-gatsu, shi-gatsu, go-gatsu, roku-gatsu, shichi-gatsu, hachi-gatsu, ku-gatsu, juu-gatsu, juu-ichi-gatsu, juu-ni-gatsu", "kana": "いちがつ、にがつ、さんがつ、しがつ、ごがつ、ろくがつ、しちがつ、はちがつ、くがつ、じゅうがつ、じゅういちがつ、じゅうにがつ", "en": "Months 1-12"},
        32: {"romaji": "ichi-ji, ni-ji, san-ji, yo-ji, go-ji, roku-ji, shichi-ji, hachi-ji, ku-ji, juu-ji, juu-ichi-ji, juu-ni-ji", "kana": "いちじ、にじ、さんじ、よじ、ごじ、ろくじ、しちじ、はちじ、くじ、じゅうじ、じゅういちじ、じゅうにじ", "en": "Time: 1-12 o'clock"},
        33: {"romaji": "roku-juu-nana, ni-juu-go, yon-juu-san, nana-juu-ni, juu-roku, go-juu-ichi, hyaku", "kana": "ろくじゅうなな、にじゅうご、よんじゅうさん、ななじゅうに、じゅうろく、ごじゅういち、ひゃく", "en": "Practice: Numbers"},
        34: {"romaji": "shi-gatsu, juu-ni-gatsu, shichi-gatsu, ni-gatsu, juu-ichi-gatsu, juu-gatsu", "kana": "しがつ、じゅうにがつ、しちがつ、にがつ、じゅういちがつ、じゅうがつ", "en": "Practice: Months"},
        35: {"romaji": "yo-ji, juu-ichi-ji, go-ji, shichi-ji, san-ji, ichi-ji, ni-ji, hachi-ji, juu-ji, juu-ni-ji", "kana": "よじ、じゅういちじ、ごじ、しちじ、さんじ、いちじ、にじ、はちじ、じゅうじ、じゅうにじ", "en": "Practice: Time"},
        36: {"romaji": "O-jigi", "kana": "おじぎ", "en": "Bow (Japanese etiquette)"}
    }

def get_001_main_speech():
    """Lesson #001 本編スライド (24p) 用の発音データ辞書"""
    return {
        1: {"romaji": "Nihongo no moji to hatsuon", "kana": "にほんごのもじとはつおん", "en": "Japanese Writing Systems & Pronunciation"},
        2: {"romaji": "Kanji", "kana": "かんじ", "en": "Kanji"},
        3: {"romaji": "Hiragana", "kana": "ひらがな", "en": "Hiragana"},
        4: {"romaji": "Katakana", "kana": "カタカナ", "en": "Katakana"},
        5: {"romaji": "Roomaji", "kana": "ローマじ", "en": "Roomaji"},
        6: {"romaji": "a, i, u, e, o", "kana": "あ、い、う、え、お", "en": "Basic syllables (a, i, u, e, o)"},
        7: {"romaji": "Chouon", "kana": "ちょうおん", "en": "Long Vowels"},
        8: {"romaji": "Haifun", "kana": "ハイフン", "en": "Hyphens"},
        9: {"romaji": "Aposutorofi", "kana": "アポストロフィ", "en": "Apostrophes"},
        10: {"romaji": "Hatsuon 'N'", "kana": "はつおん「ん」", "en": "'N' Sound"},
        11: {"romaji": "Sokuon", "kana": "そくおん", "en": "Double Consonants"},
        12: {"romaji": "Ryakugo", "kana": "りゃくご", "en": "Abbreviations"},
        13: {"romaji": "Boin: a, i, u, e, o", "kana": "ぼいん：あ、い、う、え、お", "en": "5 Vowels"},
        14: {"romaji": "Museika: i, u", "kana": "むせいか：い、う", "en": "Voiceless Vowels"},
        15: {"romaji": "Han-boin Y: ya, yu, yo", "kana": "はんぼいんワイ：や、ゆ、よ", "en": "Semi-vowel Y"},
        16: {"romaji": "Han-boin W: wa", "kana": "はんぼいんダブリュー：わ", "en": "Semi-vowel W"},
        17: {"romaji": "Shiin", "kana": "しいん", "en": "Consonants"},
        18: {"romaji": "Shiin no hatsuon gaido", "kana": "しいんのはつおんガイド", "en": "Japanese Pronunciation Guide"},
        19: {"romaji": "Fu", "kana": "ふ", "en": "Fu Sound"},
        20: {"romaji": "Ra, ri, ru, re, ro", "kana": "ら、り、る、れ、ろ", "en": "R Sound"},
        21: {"romaji": "Ga, gi, gu, ge, go", "kana": "が、ぎ、ぐ、げ、ご", "en": "G Sound"},
        22: {"romaji": "Za, ji, zu, ze, zo", "kana": "ざ、じ、ず、ぜ、ぞ", "en": "Z Sound"},
        23: {"romaji": "Sokuon: kk, ss, tt, pp", "kana": "そくおん：っ", "en": "Double Consonant Sounds"},
        24: {"romaji": "Akusento to rizumu", "kana": "アクセントとリズム", "en": "Accent and Rhythm"}
    }

def main():
    workspace = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_001_fc = os.path.join(workspace, '#001_02_日本語の文字と発音_FC.pptx')
    file_002_fc = os.path.join(workspace, '#002_02_Lesson1_あいさつ_FC.pptx')
    out_js = os.path.join(workspace, 'js', 'speech-data.js')

    speech_database = {}

    # 1. #001 本編スライド (24p)
    data_001_main = get_001_main_speech()
    speech_database["slides/001_01_japanese_writing.pdf"] = data_001_main
    print(f"Generated {len(data_001_main)} items for #001 Main")

    # 2. #001 フラッシュカード (153p)
    if os.path.exists(file_001_fc):
        print(f"Reading {file_001_fc}...")
        data_001_fc = extract_001_fc(file_001_fc)
        speech_database["slides/001_02_japanese_writing_fc.pdf"] = data_001_fc
        print(f"Extracted {len(data_001_fc)} items for #001 FC")

    # 3. #002 本編スライド (36p)
    data_002_main = get_002_main_speech()
    speech_database["slides/002_01_lesson1_aisatsu.pdf"] = data_002_main
    print(f"Generated {len(data_002_main)} items for #002 Main")

    # 4. #002 フラッシュカード (76p)
    if os.path.exists(file_002_fc):
        print(f"Reading {file_002_fc}...")
        data_002_fc = extract_002_fc(file_002_fc)
        speech_database["slides/002_02_lesson1_aisatsu_fc.pdf"] = data_002_fc
        print(f"Extracted {len(data_002_fc)} items for #002 FC")

    js_content = f"""/**
 * 日本語音声発音データ辞書 (Web Speech API 用)
 * 自動生成スクリプト: scripts/extract_speech_data.py
 * 本編スライドおよびフラッシュカードに対応
 */

const SPEECH_DATA = {json.dumps(speech_database, ensure_ascii=False, indent=2)};
"""

    with open(out_js, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Successfully generated {out_js} (Total entries: {sum(len(v) for v in speech_database.values())})")

if __name__ == '__main__':
    main()


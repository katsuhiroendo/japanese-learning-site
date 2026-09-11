/**
 * 日本語教育ポータル レッスンデータ定義
 * 100レッスン規模に完全対応するデータストア（日英併記対応）
 */

const LESSONS_DATA = [
  {
    id: "001",
    number: "#001",
    title: "日本語の文字と発音",
    subtitle: "Japanese Writing Systems & Pronunciation",
    category: "文字・発音",
    level: "入門",
    description: "日本語を構成する3種類の文字（ひらがな・カタカナ・漢字）の役割と特徴、母音・子音・長音・促音など正しい日本語発音の基礎を丁寧に学習します。",
    descriptionEn: "Carefully learn the roles and characteristics of the 3 Japanese writing systems (Hiragana, Katakana, and Kanji), along with natural pronunciation fundamentals including vowels, consonants, long vowels, and double consonants.",
    materials: [
      {
        id: "main",
        title: "📖 本編スライド <span class=\"ui-en\">/ Main</span> (24p)",
        file: "slides/001_01_japanese_writing.pdf",
        pages: 24,
        badge: "本編"
      },
      {
        id: "fc",
        title: "🎴 フラッシュカード <span class=\"ui-en\">/ Flashcards</span> (153p) <span class=\"tab-audio-tag\">🔊音声</span>",
        file: "slides/001_02_japanese_writing_fc.pdf",
        pages: 153,
        badge: "フラッシュカード"
      }
    ],
    video: {
      title: "【解説動画】日本語の文字（ひらがな・カタカナ・漢字）と発音のきほん",
      youtubeId: "mOERMe1QgrE",
      youtubeUrl: "https://youtu.be/mOERMe1QgrE",
      description: "口の開け方・舌の位置・音の長さなど、ネイティブの発音とリズムを動画で一緒に確認しましょう。",
      descriptionEn: "Watch this video to practice mouth shapes, tongue positions, sound lengths, and natural speech rhythm with native pronunciation."
    },
    tags: ["入門", "ひらがな", "カタカナ", "漢字", "発音", "五十音"],
    available: true
  },
  {
    id: "002",
    number: "#002",
    title: "Lesson 1：あいさつ（Greetings）",
    subtitle: "Everyday Greetings & Basic Conversations",
    category: "基本会話",
    level: "初級1",
    description: "出会った時、別れる時、お礼を言う時の必須あいさつフレーズ。日常会話をスムーズに始めるための『5つの魔法のあいさつ』と対話表現を身につけます。",
    descriptionEn: "Essential greeting phrases for meeting, parting, and saying thank you. Master the '5 magic greetings' and key conversational patterns to start everyday Japanese conversations smoothly.",
    materials: [
      {
        id: "main",
        title: "📖 本編スライド <span class=\"ui-en\">/ Main</span> (36p)",
        file: "slides/002_01_lesson1_aisatsu.pdf",
        pages: 36,
        badge: "本編"
      },
      {
        id: "fc",
        title: "🎴 フラッシュカード <span class=\"ui-en\">/ Flashcards</span> (76p) <span class=\"tab-audio-tag\">🔊音声</span>",
        file: "slides/002_02_lesson1_aisatsu_fc.pdf",
        pages: 76,
        badge: "フラッシュカード"
      }
    ],
    video: {
      title: "【解説動画】Lesson 1 基本のあいさつ 会話練習",
      youtubeId: "F3wYl5w9RQE",
      youtubeUrl: "https://www.youtube.com/watch?v=F3wYl5w9RQE",
      description: "スライドに出てくる会話を声に出してリピート練習しましょう。朝・昼・夜のあいさつの使い分けも解説します。",
      descriptionEn: "Repeat the conversations aloud along with the video. Learn how to naturally use morning, afternoon, and evening greetings in real situations."
    },
    tags: ["初級", "あいさつ", "日常会話", "フラッシュカード", "会話表現"],
    available: true
  },
  {
    id: "003",
    number: "#003",
    title: "Lesson 2：自己紹介（Self-introduction）",
    subtitle: "Introducing Yourself & Meeting People",
    category: "基本会話",
    level: "初級1",
    description: "「はじめまして、〜です。よろしくおねがいします。」名前、国籍、職業を相手に伝える自己紹介の定型表現と基本文型を学びます。",
    descriptionEn: "Learn essential self-introduction phrases ('Nice to meet you, I am... Pleased to meet you.') and basic sentence structures to introduce your name, nationality, and occupation.",
    materials: [
      {
        id: "main",
        title: "📖 本編スライド <span class=\"ui-en\">/ Main</span> (準備中)",
        file: "",
        pages: 0,
        badge: "準備中"
      }
    ],
    video: {
      title: "【解説動画】Lesson 2 初めての自己紹介",
      youtubeId: "2Xw9Y6yF7gM",
      youtubeUrl: "https://www.youtube.com/watch?v=2Xw9Y6yF7gM",
      description: "名刺交換やクラスでの自己紹介で使える自然な表現を練習します。",
      descriptionEn: "Practice natural expressions useful when introducing yourself in classes, workplaces, and exchanges."
    },
    tags: ["初級", "自己紹介", "名詞文", "〜は〜です"],
    available: false
  },
  {
    id: "004",
    number: "#004",
    title: "Lesson 3：これ・それ・あれ（Demonstratives）",
    subtitle: "Things and Possessions (Ko-So-A-Do)",
    category: "文法",
    level: "初級1",
    description: "指示詞（これ・それ・あれ・どれ）の使い方と、「これは何ですか」「〜の〜」を使った持ち物の表現を学びます。",
    descriptionEn: "Master Japanese demonstratives (ko-so-a-do: this, that, that over there, which) and express possession with 'whose' and 'what is this?'.",
    materials: [],
    video: {
      title: "【解説動画】これ・それ・あれの距離感マスター",
      youtubeId: "",
      youtubeUrl: "",
      description: "話し手と聞き手の距離感による使い分けのポイント。",
      descriptionEn: "Key points for choosing demonstratives based on physical and psychological distance between speakers."
    },
    tags: ["初級", "指示詞", "文法", "物の名前"],
    available: false
  },
  {
    id: "005",
    number: "#005",
    title: "Lesson 4：ここ・そこ・あそこ（Places）",
    subtitle: "Asking Directions & Locations",
    category: "基本会話",
    level: "初級1",
    description: "場所を表す言葉（ここ・そこ・あそこ・どこ）と、教室や駅、デパートの案内表現を練習します。",
    descriptionEn: "Practice location words (here, there, over there, where) and useful expressions for asking and giving directions at stations and stores.",
    materials: [],
    tags: ["初級", "場所", "道案内", "案内"],
    available: false
  },
  {
    id: "006",
    number: "#006",
    title: "Lesson 5：数字と時間（Numbers & Time）",
    subtitle: "Telling Time, Numbers & Schedules",
    category: "語彙・数詞",
    level: "初級1",
    description: "1〜10,000の数字の数え方、「今何時ですか」、曜日とスケジュールの表現を学びます。",
    descriptionEn: "Learn counting from 1 to 10,000, asking and telling the time ('What time is it now?'), days of the week, and daily schedule expressions.",
    materials: [],
    tags: ["初級", "数字", "時間", "曜日"],
    available: false
  },
  {
    id: "007",
    number: "#007",
    title: "Lesson 6：買い物と値段（Shopping）",
    subtitle: "Shopping Phrases & How Much",
    category: "実用会話",
    level: "初級1",
    description: "「いくらですか」「これをください」など、お店やレストランでスムーズに買い物をする会話表現です。",
    descriptionEn: "Essential shopping and dining phrases such as 'How much is this?' and 'I will take this, please' for smooth communication in shops.",
    materials: [],
    tags: ["初級", "買い物", "値段", "注文"],
    available: false
  },
  {
    id: "008",
    number: "#008",
    title: "Lesson 7：日課と動詞（Daily Routine）",
    subtitle: "Verbs (Present Affirmative & Negative)",
    category: "文法",
    level: "初級1",
    description: "「〜ます / 〜ません / 〜ました」の動詞活用と、朝起きてから夜寝るまでの日常行動を伝える表現。",
    descriptionEn: "Learn polite verb conjugations (-masu / -masen / -mashita) and describe your daily routines from morning until bedtime.",
    materials: [],
    tags: ["初級", "動詞", "ます形", "日課"],
    available: false
  },
  {
    id: "009",
    number: "#009",
    title: "Lesson 8：移動と交通手段（Going Places）",
    subtitle: "Go, Come, Return & Transportation",
    category: "文法",
    level: "初級1",
    description: "「行きます / 来ます / 帰ります」と助詞「へ」「で」「と」を使った行き先・乗り物の表現。",
    descriptionEn: "Express destinations and transportation using motion verbs (go, come, return) and Japanese particles 'e', 'de', and 'to'.",
    materials: [],
    tags: ["初級", "移動", "助詞", "交通機関"],
    available: false
  },
  {
    id: "010",
    number: "#010",
    title: "Lesson 9：食事と趣味（Food & Hobbies）",
    subtitle: "Likes, Dislikes & Eating Out",
    category: "実用会話",
    level: "初級1",
    description: "好きな食べ物、趣味、「〜をたべます」「〜をのみます」などの目的語をとる動詞表現。",
    descriptionEn: "Talk about your favorite foods, hobbies, and transitive verbs with objects using the particle 'o' (e.g., eat, drink, read).",
    materials: [],
    tags: ["初級", "食事", "趣味", "助詞を"],
    available: false
  }
];

// 100レッスン対応：カリキュラムの全タイトル計画リスト
const CURRICULUM_PLAN = [
  "文字と発音", "あいさつ", "自己紹介", "これ・それ・あれ", "ここ・そこ・あそこ",
  "数字と時間", "買い物と値段", "日課と動詞", "移動と交通", "食事と趣味",
  "家族と人間関係", "形容詞（い形容詞）", "形容詞（な形容詞）", "欲しいものと希望（〜たい）", "助詞の総整理",
  "て形の基本", "進行形（〜ています）", "許可と禁止（〜てもいい）", "理由を言う（〜から）", "順序と手順",
  "過去の経験（〜たことがある）", "提案と誘い（〜ましょう）", "比較（〜より〜のほうが）", "最上級表現", "好みの表現",
  "能力と可能動詞", "趣味の深掘り", "病気と病院の会話", "天候と季節", "予定と推量（〜でしょう）",
  "意向形（〜よう）", "命令と禁止", "条件表現（〜たら）", "条件表現（〜ば・なら）", "授受動詞（あげる・もらう・くれる）",
  "受け身表現", "使役表現", "使役受け身", "敬語の基本（尊敬語）", "敬語の基本（謙譲語）",
  "ビジネス電話応対", "メールの書き方", "日本の年中行事", "住まいと賃貸", "銀行・郵便局",
  "交通トラブル対応", "緊急時・防災の日本語", "日本の食文化", "仕事の指示と報告", "感情表現",
  "ことわざ・慣用句", "オノマトペ（擬音語・擬態語）", "複合動詞", "接続詞の使い分け", "連体修飾節",
  "引用の表現（〜と言いました）", "様態と伝聞（〜そうだ）", "確信の度合い（〜はず・〜かもしれない）", "目的表現（〜ために・〜ように）", "変化の表現（〜になる・〜にする）",
  "義務と必要（〜なければならない）", "助言の表現（〜ほうがいい）", "推測の表現（〜らしい・〜ようだ）", "状態の維持（〜てある・〜ておく）", "試みと準備（〜てみる）",
  "結果の状態（〜てしまう）", "並列表現（〜たり〜たり）", "限定表現（〜だけ・〜しか）", "逆接表現（〜のに・〜ても）", "比例の表現（〜につれて）",
  "基準の表現（〜にとって・〜に対して）", "話題の提示（〜に関して）", "原因と契機（〜によって）", "範囲の表現（〜にわたって）", "強調の表現（〜こそ・〜さえ）",
  "場面別ロールプレイ1", "場面別ロールプレイ2", "場面別ロールプレイ3", "場面別ロールプレイ4", "場面別ロールプレイ5",
  "ニュースを読む1", "ニュースを読む2", "意見を述べる", "ディスカッションの日本語", "プレゼンテーションの技法",
  "日本の伝統文化", "日本のアニメ・ポップカルチャー", "日本の社会とマナー", "環境問題と社会", "科学とテクノロジー",
  "エッセイ読解", "短編小説を読む", "インタビューの日本語", "敬語の総合演習", "ビジネス商談の日本語",
  "JLPT N3総合対策1", "JLPT N3総合対策2", "JLPT N2導入演習", "総まとめ復習1", "修了総合試験と振り返り"
];

// 100レッスンまで補完する自動ジェネレーター（日英併記）
(function generateRemainingLessons() {
  const currentCount = LESSONS_DATA.length;
  for (let i = currentCount + 1; i <= 100; i++) {
    const numStr = String(i).padStart(3, "0");
    const planIndex = i - 1;
    const planTopic = CURRICULUM_PLAN[planIndex] || `応用演習 第${i}課`;
    const level = i <= 25 ? "初級1" : (i <= 50 ? "初級2" : (i <= 75 ? "中級1" : "中級2"));
    const category = i <= 25 ? "初級総合" : (i <= 50 ? "文法・表現" : (i <= 75 ? "中級会話・読解" : "応用・ビジネス"));

    LESSONS_DATA.push({
      id: numStr,
      number: `#${numStr}`,
      title: `Lesson ${i}：${planTopic}`,
      subtitle: `Japanese Lesson ${i} - ${planTopic}`,
      category: category,
      level: level,
      description: `第${i}課のカリキュラムです。${planTopic}に関する重要語彙、表現パターン、実践会話を学習します。（スライド資料順次公開予定）`,
      descriptionEn: `Curriculum for Lesson ${i}. Master essential vocabulary, key sentence patterns, and practical dialogue on "${planTopic}". (Slide materials coming soon)`,
      materials: [],
      video: {
        title: `【解説動画】Lesson ${i} ${planTopic}`,
        youtubeId: "",
        youtubeUrl: "",
        description: `Lesson ${i} の解説動画です。`,
        descriptionEn: `Explanation video for Lesson ${i}.`
      },
      tags: [level, category, planTopic],
      available: false
    });
  }
})();

// グローバルスコープ（ブラウザ・Node両対応）
if (typeof window !== "undefined") {
  window.LESSONS_DATA = LESSONS_DATA;
}
if (typeof globalThis !== "undefined") {
  globalThis.LESSONS_DATA = LESSONS_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LESSONS_DATA };
}

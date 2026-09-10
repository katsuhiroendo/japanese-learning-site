# 🌸 にほんご学習ポータル (Nihongo Learning Portal)

日本語教育用のプレゼンテーション資料（PowerPointから変換したPDF）および解説動画（YouTube）を快適に閲覧・学習できるWebサイトです。

100レッスン規模のカリキュラムに対応し、洗練された「和モダン × 親しみやすさ」をテーマにしたデザインを採用しています。GitHub Pagesなどの無料ホスティングサービスで簡単に世界中へ公開できます。

---

## ✨ 主な特長と機能

1. **洗練された親しみやすいデザイン**
   - 信頼感ある藍色と優しい桜色・山吹色のアクセント、和の温もりを感じる丸ゴシックフォント（`Zen Maru Gothic`）を採用。
   - PC、タブレット、スマートフォンの全画面サイズに対応（レスポンシブ設計）。

2. **100レッスン対応の直感的な一覧・検索**
   - #001, #002 の番号順カードレイアウト。
   - リアルタイム検索（レッスン番号、タイトル、タグ、キーワード）。
   - 番号別フィルター（#001〜#020、#021〜#040...）やカテゴリ別フィルター。
   - 学習者のモチベーションを高める「完了チェック」機能（ブラウザに自動保存）。

3. **高画質・軽快なスライドビューワー (PDF.js)**
   - 左右の大きな **[＜]** と **[＞]** ボタンで快適にページめくり。
   - キーボードの矢印キー（`←` / `→`）やモバイルのスワイプ操作に対応。
   - 全画面表示モード（プロジェクターや大画面での授業・学習に最適）。
   - 1レッスンに複数の資料（本編スライドと単語カードなど）がある場合のタブ切り替え対応。

4. **YouTube解説動画プレイヤー**
   - レッスンごとにYouTube動画のURL/IDを設定可能。
   - クリックで高画質再生、解説テキストも掲載。

5. **Mac用 自動化ツール付属**
   - `PPTX一括変換.command`：フォルダ内の全パワーポイント（.pptx）をダブルクリックだけでPDFに自動変換。
   - `ローカル確認.command`：ダブルクリックするだけでローカルWebサーバーを起動し、ブラウザで即座に動作確認可能。

---

## 📁 ディレクトリ構成

```
日本語教育/
├── index.html                   # メインページ（一覧 ＆ レッスン詳細）
├── ローカル確認.command          # ダブルクリックでローカル確認起動
├── PPTX一括変換.command          # ダブルクリックでPPTXをPDF一括変換
├── css/
│   ├── style.css                # サイト全体スタイル（和モダンデザイン）
│   └── viewer.css               # スライドビューワー＆動画プレイヤースタイル
├── js/
│   ├── app.js                   # アプリケーションロジック・画面遷移
│   ├── viewer.js                # PDF.js カスタムスライドビューワー
│   └── lessons-data.js          # レッスンデータ定義（100レッスン対応）
├── lib/
│   ├── pdf.min.js               # PDF.js 本体（ローカル動作対応）
│   └── pdf.worker.min.js        # PDF.js ワーカー
├── slides/                      # PDF変換済み資料フォルダ
│   ├── 001_japanese_writing.pdf
│   ├── 002_01_lesson1_aisatsu.pdf
│   └── 002_02_lesson1_aisatsu_fc.pdf
├── scripts/
│   └── convert_pptx_to_pdf.py   # PPTX一括変換スクリプト
├── .gitignore                   # Git除外設定
├── README.md                    # 本説明書
└── DEPLOY_GUIDE.md              # 無料Web公開手順書（GitHub Pages等）
```

---

## 🚀 使い方

### 1. 手元でプレビュー確認する
`ローカル確認.command` をダブルクリックしてください。
自動的にターミナルが開き、ブラウザ（SafariやChrome）でサイト（`http://localhost:8000`）が表示されます。

### 2. 新しいパワーポイント資料を追加する
1. この作業フォルダに新しい `.pptx` ファイル（例: `#003_Lesson2_自己紹介.pptx`）を保存します。
2. `PPTX一括変換.command` をダブルクリックします。
   - PowerPointが自動で起動し、`slides/` フォルダ内に高品質なPDFが作成されます。
3. `js/lessons-data.js` をテキストエディタで開き、該当レッスンの資料情報（ファイルパスなど）とYouTube動画URLを更新します。

### 3. 無料でWeb上に公開する
詳しい手順は [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) をご覧ください。
GitHub Pages を利用することで、完全無料で独自のWebサイトとして全世界に公開できます。

---

## 🛠️ レッスンデータの編集方法 (`js/lessons-data.js`)

各レッスンの情報は `js/lessons-data.js` 内の `LESSONS_DATA` 配列で管理されています。

```javascript
{
  id: "002",
  number: "#002",
  title: "Lesson 1：あいさつ（Greetings）",
  subtitle: "Everyday Greetings & Basic Conversations",
  category: "基本会話",
  level: "初級1",
  description: "日常会話をスムーズに始めるための『5つの魔法のあいさつ』と対話表現を身につけます。",
  materials: [
    {
      id: "main",
      title: "📖 本編スライド (36p)",
      file: "slides/002_01_lesson1_aisatsu.pdf",
      pages: 36,
      badge: "本編"
    },
    {
      id: "fc",
      title: "🎴 単語フラッシュカード (76p)",
      file: "slides/002_02_lesson1_aisatsu_fc.pdf",
      pages: 76,
      badge: "単語カード"
    }
  ],
  video: {
    title: "【解説動画】Lesson 1 基本のあいさつ 会話練習",
    youtubeId: "F3wYl5w9RQE", // YouTubeの動画IDまたはURL
    youtubeUrl: "https://www.youtube.com/watch?v=F3wYl5w9RQE",
    description: "スライドに出てくる会話を声に出してリピート練習しましょう。"
  },
  tags: ["初級", "あいさつ", "日常会話", "フラッシュカード"],
  available: true // 公開時は true に設定
}
```

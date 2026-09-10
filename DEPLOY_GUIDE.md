# 🌐 GitHub Pages による無料Webサイト公開手順書

このWebサイトは純粋な静的サイト（HTML/CSS/JavaScript）で構成されているため、**GitHub Pages** を利用して完全無料で世界中に公開できます。サーバー費用は一切かかりません。

---

## 📋 公開までの全体フロー（初回のみ・約5分）

1. **GitHubアカウントの用意**
2. **GitHub上で新しいリポジトリを作成**
3. **ローカルのファイルをGitHubに送信（push）**
4. **GitHub Pagesの設定をオンにする**
5. **公開URLでアクセス確認**

---

## 🛠️ ステップ・バイ・ステップ手順

### ステップ 1: GitHubでリポジトリを作成する
1. ブラウザで [GitHub](https://github.com/) にログインします（アカウントがない場合は新規登録）。
2. 右上の「**+**」アイコンをクリックし、「**New repository**」を選択します。
3. リポジトリ設定を入力します：
   - **Repository name**: `nihongo-study`（お好きな名前で構いません）
   - **Public / Private**: `Public`（無料のGitHub Pagesを利用する場合はPublicを選択）
   - **Initialize this repository with**: すべてチェックを入れずに空のままにします。
4. 「**Create repository**」ボタンをクリックします。

---

### ステップ 2: ローカルからGitで送信（push）する
Macの「ターミナル」アプリを開き、本作業フォルダに移動して以下のコマンドを順番に実行します。

```bash
# 1. 作業フォルダに移動（例）
cd "/Users/katsuhiroendo/Library/CloudStorage/GoogleDrive-xendouk@gmail.com/マイドライブ/0006_ホームページ作成/日本語教育"

# 2. Git初期化
git init -b main

# 3. 全ファイルを追加・コミット
git add .
git commit -m "Initial commit: 日本語教育ポータルサイト"

# 4. GitHubのリポジトリURLを登録（※ YOUR_USERNAME と nihongo-study はご自身のリポジトリに変更）
git remote add origin https://github.com/YOUR_USERNAME/nihongo-study.git

# 5. GitHubへ送信
git push -u origin main
```

---

### ステップ 3: GitHub Pages を有効化する
1. GitHubのリポジトリ画面を開きます。
2. 上部メニューの「**Settings**（設定）」タブをクリックします。
3. 左サイドバーの「**Pages**」をクリックします。
4. 「**Build and deployment**」セクションで：
   - **Source**: `Deploy from a branch` を選択
   - **Branch**: `main` を選択し、フォルダは `/ (root)` のまま「**Save**」をクリックします。
5. 1〜2分待つと、画面上部に公開URLが表示されます：
   - 例: `https://YOUR_USERNAME.github.io/nihongo-study/`

このURLをクリックすると、世界中の誰もがあなたの日本語学習ポータルにアクセスできるようになります！

---

## 🔄 レッスンを追加・更新したときの手順

新しいパワーポイントやレッスンを追加した時は、以下の3ステップで自動的に公開サイトが更新されます。

1. 新しいパワーポイントを保存し、`PPTX一括変換.command` をダブルクリックしてPDFに変換。
2. `js/lessons-data.js` を更新。
3. ターミナルで変更を送信：
   ```bash
   git add .
   git commit -m "Add new lesson"
   git push
   ```
   約1分後に、GitHub Pagesのサイトに新しいレッスンが自動反映されます。

---

## 💡 他の無料公開サービスを利用したい場合
GitHub Pages以外にも、以下のサービスにそのままドラッグ＆ドロップまたはGitHub連携で公開可能です：
- **Cloudflare Pages** (https://pages.cloudflare.com/) - 完全無料・超高速
- **Vercel** (https://vercel.com/) - 完全無料
- **Netlify** (https://www.netlify.com/) - 完全無料・フォルダをブラウザにドラッグ＆ドロップするだけで即座に公開可能

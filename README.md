# メモアプリ（研究室用）

Firebase を使用して構築されたシンプルなメモアプリです。研究室内でスレッドを作成し、メモを共有するための機能を提供します。

## 主な機能

- Googleアカウントによる認証（ホワイトリストによるアクセス制限）
- スレッドとメモの作成、編集、削除
- ユーザー管理（ロール：開発者、教授、メンバー）
- テーマカスタマイズ
- メモの検索機能
- リアクション機能

## 技術スタック

- フロントエンド: React 19, TypeScript, Vite
- UI: Tailwind CSS, Headless UI, Heroicons
- バックエンド: Firebase (Authentication, Firestore)
- ルーティング: React Router

## 開発方法

### 必要条件

- Node.js 20.x 以上
- npm 10.x 以上

### セットアップ手順

```js
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 環境変数設定

`.env` ファイルを作成して以下の環境変数を設定してください：

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## ディレクトリ構造

- `src/`: ソースコード
  - `components/`: UIコンポーネント
  - `contexts/`: Reactコンテキスト（認証、テーマなど）
  - `config/`: 設定ファイル
  - `hooks/`: カスタムフック
  - `types/`: TypeScript型定義
  - `utils/`: ユーティリティ関数

#!/bin/bash
# firebase-migration.sh
# Firebase データ移行用スクリプト

echo "🔄 Firebase データ移行開始"

# 1. Firestore データのエクスポート
echo "📊 Firestore データエクスポート中..."
gcloud firestore export gs://your-backup-bucket/firestore-export-$(date +%Y%m%d)

# 2. Authentication ユーザーのエクスポート（管理画面から手動）
echo "👥 Authentication データは管理画面からCSVエクスポートしてください"
echo "Firebase Console → Authentication → Users → Export users"

# 3. Storage ファイルの同期
echo "📁 Storage ファイル同期中..."
gsutil -m rsync -r gs://old-project-bucket gs://new-project-bucket

# 4. Functions のデプロイ準備
echo "⚙️ Functions デプロイ準備..."
firebase use new-project-id
firebase deploy --only functions

# 5. Hosting の設定
echo "🌐 Hosting 設定..."
firebase deploy --only hosting

echo "✅ 移行スクリプト完了"
echo "⚠️  アプリケーション設定ファイルの更新を忘れずに！"

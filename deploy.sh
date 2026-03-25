#!/bin/bash
# K-Bio Pipeline Tracker 배포 스크립트
# .env 파일에서 AWS 자격증명을 읽어옵니다

set -e

# Load .env
if [ -f "$(dirname "$0")/.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/.env" | xargs)
fi

EC2_INSTANCE_ID="i-01752a66723f975bf"
BUCKET="kbio-deploy-$(date +%s)"

echo "📦 Building K-Bio Pipeline Tracker..."
npm run build

echo "🪣 Creating temporary S3 bucket: $BUCKET"
aws s3 mb "s3://$BUCKET" --region ap-northeast-2

echo "⬆️  Uploading dist to S3..."
aws s3 sync dist/ "s3://$BUCKET/dist/" --delete --region ap-northeast-2

echo "🔓 Granting EC2 role access to bucket..."
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": {\"AWS\": \"arn:aws:iam::027825871559:role/TierifyEC2Role\"},
    \"Action\": [\"s3:GetObject\", \"s3:ListBucket\"],
    \"Resource\": [\"arn:aws:s3:::$BUCKET\", \"arn:aws:s3:::$BUCKET/*\"]
  }]
}"

echo "🚀 Deploying to EC2 via SSM..."
CMD_ID=$(aws ssm send-command \
  --instance-ids "$EC2_INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "{\"commands\":[
    \"aws s3 sync s3://$BUCKET/dist/ /usr/share/nginx/html/ --delete --region ap-northeast-2\",
    \"nginx -t && systemctl reload nginx\",
    \"echo Deploy OK\"
  ]}" \
  --query "Command.CommandId" --output text --region ap-northeast-2)

echo "⏳ Waiting for deployment..."
sleep 15
RESULT=$(aws ssm get-command-invocation \
  --command-id "$CMD_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --query "StandardOutputContent" --output text --region ap-northeast-2)
echo "$RESULT"

echo "🧹 Cleaning up S3 bucket..."
aws s3 rm "s3://$BUCKET" --recursive
aws s3 rb "s3://$BUCKET"

echo "✅ 배포 완료! → http://13.124.75.74"

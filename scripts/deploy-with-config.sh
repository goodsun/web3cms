#!/bin/bash

# Deploy with proper configuration order
# This ensures API URL is available before frontend build

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified. Usage: ./deploy-with-config.sh [dev|staging|prod]"
    exit 1
fi

ENV=$1
print_status "Starting deployment for environment: ${ENV}"

# Step 1: Deploy CDK stack (backend only, without frontend build)
print_status "Step 1/4: Deploying CDK stack..."
npm run deploy:${ENV}:base -- --require-approval never

# Step 2: Update frontend configuration with API endpoint
print_status "Step 2/4: Updating frontend configuration..."
./scripts/update-frontend-config.sh ${ENV}

# Step 3: Build frontend with updated configuration
print_status "Step 3/4: Building frontend..."
npm run build:frontend

# Step 4: Upload built frontend to S3
print_status "Step 4/4: Uploading frontend to S3..."
PROJECT_NAME=${PROJECT_NAME:-$(grep PROJECT_NAME .env | cut -d '=' -f2)}
AWS_REGION=${AWS_REGION:-$(grep AWS_REGION .env | cut -d '=' -f2 || echo "ap-northeast-1")}
BUCKET_NAME="${PROJECT_NAME}-frontend-${ENV}"

aws s3 sync frontend/dist/ s3://${BUCKET_NAME}/ \
    --delete \
    --region ${AWS_REGION}

# Invalidate CloudFront
STACK_PREFIX=$(echo $PROJECT_NAME | awk -F'-' '{for(i=1;i<=NF;i++){$i=toupper(substr($i,1,1)) substr($i,2)}}1' | sed 's/ //g')
ENV_SUFFIX=$(echo $ENV | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
STACK_NAME="${STACK_PREFIX}-${ENV_SUFFIX}"

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    print_status "Creating CloudFront invalidation..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --region $AWS_REGION > /dev/null
fi

print_status "Deployment completed successfully!"

# Output URLs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo ""
    print_status "Your application is available at: ${CLOUDFRONT_URL}"
    print_status "API endpoint: ${API_ENDPOINT}"
fi
# Web3CMS Deployment Guide

## Overview

This guide covers the deployment process for Web3CMS to AWS using AWS CDK. The application supports three environments: development (dev), staging, and production (prod).

## Prerequisites

### Required Software

1. **Node.js** (v20.x or higher)
   ```bash
   node --version  # Should output v20.x.x or higher
   ```

2. **AWS CLI** (v2.x)
   ```bash
   aws --version
   ```

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS Configuration

1. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   Enter your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., us-east-1)
   - Default output format (json)

2. **Verify AWS Access**
   ```bash
   aws sts get-caller-identity
   ```

3. **Bootstrap CDK** (first time only)
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

## Quick Deployment

### One-Command Deployment

The fastest way to deploy is using the provided npm scripts:

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

These commands will:
1. Build the TypeScript code
2. Deploy the CDK stack
3. Update frontend configuration
4. Invalidate CloudFront cache

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
# Root directory
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Backend dependencies
cd backend
npm install
cd ..
```

### 2. Build the Project

```bash
# Build TypeScript files
npm run build

# Build frontend
cd frontend
npm run build
cd ..
```

### 3. Deploy Infrastructure

```bash
# Deploy to development
cdk deploy --context env=dev

# Deploy to staging
cdk deploy --context env=staging

# Deploy to production
cdk deploy --context env=prod
```

### 4. Update Frontend Configuration

After deployment, update the frontend with the API endpoint:

```bash
# Using the provided script
./scripts/update-frontend-config.sh dev

# Or manually
API_URL=$(./scripts/get-api-endpoint.sh dev)
echo "VITE_API_ENDPOINT=$API_URL" > frontend/.env.production.local
```

### 5. Deploy Frontend

```bash
cd frontend
npm run build
cd ..

# The CDK deployment automatically syncs the built files to S3
```

## Deployment Scripts

### deploy-with-config.sh

Automated deployment script that handles the complete deployment process:

```bash
./scripts/deploy-with-config.sh [environment]
```

Features:
- Validates environment parameter
- Builds TypeScript code
- Deploys CDK stack
- Updates frontend configuration
- Rebuilds frontend with new config
- Syncs to S3
- Invalidates CloudFront cache

### update-frontend-config.sh

Updates the frontend configuration with the deployed API endpoint:

```bash
./scripts/update-frontend-config.sh [environment]
```

### get-api-endpoint.sh

Retrieves the API endpoint URL for a given environment:

```bash
./scripts/get-api-endpoint.sh [environment]
```

## Environment Configuration

### Environment Variables

Each environment uses specific naming conventions:

```
Development: {projectName}-{resource}-dev
Staging:     {projectName}-{resource}-staging
Production:  {projectName}-{resource}-prod
```

### CDK Context

Configure deployment parameters in `cdk.json`:

```json
{
  "context": {
    "projectName": "web3cms",
    "region": "us-east-1",
    "dev": {
      "account": "123456789012"
    },
    "staging": {
      "account": "123456789012"
    },
    "prod": {
      "account": "123456789012"
    }
  }
}
```

## Resource Overview

### Created AWS Resources

1. **API Gateway**
   - REST API with CORS enabled
   - Endpoints for items, settings, and columns

2. **Lambda Functions** (3)
   - CRUD handler
   - Settings handler
   - Columns handler

3. **DynamoDB Tables** (3)
   - Items table
   - Settings table
   - Columns table

4. **S3 Bucket**
   - Frontend hosting
   - Blocked public access

5. **CloudFront Distribution**
   - Global CDN
   - Custom error pages
   - HTTPS only

6. **IAM Roles and Policies**
   - Lambda execution roles
   - DynamoDB access policies

## Post-Deployment Tasks

### 1. Verify Deployment

Check that all resources are created:

```bash
# List CloudFormation stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Get stack outputs
aws cloudformation describe-stacks --stack-name web3cms-stack-dev
```

### 2. Test API Endpoints

```bash
# Get API URL
API_URL=$(./scripts/get-api-endpoint.sh dev)

# Test health endpoint
curl $API_URL/items

# Test public endpoints
curl $API_URL/columns/public/folders
```

### 3. Access Frontend

The CloudFront URL is output after deployment:
```
https://d1234567890abc.cloudfront.net
```

### 4. Configure Custom Domain (Optional)

1. Request ACM certificate in us-east-1
2. Update CDK stack with domain configuration
3. Configure Route53 or external DNS

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
cdk deploy --rollback

# Or destroy and redeploy
cdk destroy --context env=dev
cdk deploy --context env=dev
```

### Manual Rollback

1. **Frontend Rollback**
   ```bash
   # Restore previous build
   aws s3 sync s3://bucket-name-backup/ s3://bucket-name/ --delete
   ```

2. **Lambda Rollback**
   ```bash
   # Update function code to previous version
   aws lambda update-function-code --function-name function-name --s3-bucket bucket --s3-key previous-version.zip
   ```

## Monitoring Deployment

### CloudFormation Events

Monitor deployment progress:

```bash
# Watch stack events
watch -n 2 "aws cloudformation describe-stack-events --stack-name web3cms-stack-dev | head -20"
```

### Deployment Logs

Check CDK deployment logs:
```bash
# CDK outputs detailed logs during deployment
cdk deploy --verbose
```

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```
   Error: This stack uses assets, so the toolkit stack must be deployed
   Solution: Run 'cdk bootstrap'
   ```

2. **Insufficient IAM Permissions**
   ```
   Error: User is not authorized to perform: cloudformation:CreateStack
   Solution: Ensure AWS credentials have AdministratorAccess or required policies
   ```

3. **DynamoDB Table Exists**
   ```
   Error: Table already exists
   Solution: Either destroy existing stack or use different environment name
   ```

4. **S3 Bucket Name Conflict**
   ```
   Error: Bucket name already exists
   Solution: S3 bucket names are global; modify projectName in cdk.json
   ```

### Debug Commands

```bash
# Check Lambda logs
aws logs tail /aws/lambda/web3cms-crud-dev --follow

# Check API Gateway logs
aws logs tail API-Gateway-Execution-Logs_${REST_API_ID}/prod --follow

# Test Lambda function
aws lambda invoke --function-name web3cms-crud-dev --payload '{"httpMethod":"GET","path":"/items"}' response.json
```

## Production Deployment Checklist

- [ ] Run tests in staging environment
- [ ] Backup current production data
- [ ] Review and update environment variables
- [ ] Enable CloudWatch alarms
- [ ] Configure auto-scaling if needed
- [ ] Test rollback procedure
- [ ] Update DNS records if using custom domain
- [ ] Monitor deployment progress
- [ ] Verify all endpoints post-deployment
- [ ] Check CloudFront distribution

## Cost Optimization

### Development Environment
- Use DynamoDB on-demand pricing
- Set Lambda memory to minimum required
- Configure S3 lifecycle policies

### Production Environment
- Consider DynamoDB provisioned capacity for predictable workloads
- Enable S3 Intelligent-Tiering
- Use CloudFront caching effectively
- Set up budget alerts

## Security Considerations

### Pre-Deployment
1. Review IAM policies for least privilege
2. Enable AWS CloudTrail
3. Configure AWS Config
4. Set up AWS GuardDuty

### Post-Deployment
1. Enable S3 bucket versioning
2. Configure CloudWatch alarms
3. Set up SNS notifications for errors
4. Review API Gateway throttling limits

## Maintenance

### Regular Tasks
- Monitor CloudWatch logs and metrics
- Review and rotate access keys
- Update dependencies regularly
- Backup DynamoDB tables
- Review cost optimization reports

### Update Procedures
1. Test updates in development
2. Deploy to staging and verify
3. Schedule production deployment
4. Monitor post-deployment metrics

## Support

For deployment issues:
1. Check CloudFormation events for errors
2. Review CloudWatch logs
3. Consult AWS CDK documentation
4. Check GitHub issues for similar problems
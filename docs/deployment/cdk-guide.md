# AWS CDK Deployment Guide

## Overview

This guide covers the AWS CDK (Cloud Development Kit) setup and deployment process for Web3CMS.

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 20.x or higher
- Sufficient AWS permissions for creating resources

## CDK Stack Overview

The Web3CMS CDK stack creates the following AWS resources:

### Core Infrastructure
- **API Gateway** - REST API for backend services
- **Lambda Functions** - Serverless compute for API handlers
- **DynamoDB Tables** - NoSQL database for data storage
  - Items table
  - Settings table
  - Columns table
  - Users table
  - NFTs table

### Frontend Infrastructure
- **S3 Bucket** - Static website hosting
- **CloudFront Distribution** - CDN for global content delivery
- **Origin Access Identity** - Secure S3 access from CloudFront

### Security & Access
- **IAM Roles** - Least privilege access for Lambda functions
- **IAM Policies** - Fine-grained permissions
- **CORS Configuration** - Cross-origin resource sharing

## Deployment Commands

### Bootstrap CDK (First Time Only)

```bash
# Bootstrap CDK in your AWS account/region
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Deploy to Different Environments

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### Deploy with Specific Context

```bash
# Deploy with custom context values
cdk deploy --context env=dev --context region=us-east-1
```

## Environment Configuration

### Context Variables

The CDK stack uses context variables for environment-specific configuration:

```typescript
// cdk.json
{
  "context": {
    "dev": {
      "envName": "dev",
      "domainName": "dev.example.com"
    },
    "staging": {
      "envName": "staging",
      "domainName": "staging.example.com"
    },
    "prod": {
      "envName": "prod",
      "domainName": "example.com"
    }
  }
}
```

### Stack Configuration

Key configuration options in `lib/fullstack-serverless-cdk-stack.ts`:

```typescript
// Lambda runtime
runtime: lambda.Runtime.NODEJS_20_X

// API Gateway configuration
restApiName: `web3cms-api-${envName}`

// DynamoDB configuration
billingMode: dynamodb.BillingMode.PAY_PER_REQUEST

// CloudFront configuration
priceClass: cloudfront.PriceClass.PRICE_CLASS_100
```

## Post-Deployment Steps

### 1. Update Frontend Configuration

After deployment, update the frontend with the API endpoint:

```bash
./scripts/update-frontend-config.sh dev
```

### 2. Verify Deployment

Check the CDK outputs for important URLs:

```bash
# View stack outputs
aws cloudformation describe-stacks \
  --stack-name FullstackServerlessCdkStack-dev \
  --query 'Stacks[0].Outputs'
```

### 3. Configure Custom Domain (Optional)

See [Custom Domain Setup Guide](../future/custom-domain-setup.md) for details.

## Monitoring & Troubleshooting

### CloudWatch Logs

All Lambda functions automatically log to CloudWatch:

```bash
# View Lambda logs
aws logs tail /aws/lambda/web3cms-items-handler-dev --follow
```

### Stack Updates

To update an existing stack:

```bash
# See what changes will be made
cdk diff --context env=dev

# Deploy updates
cdk deploy --context env=dev
```

### Rollback

To rollback a failed deployment:

```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name FullstackServerlessCdkStack-dev
```

## Cost Optimization

### DynamoDB
- Uses PAY_PER_REQUEST billing mode
- No need to provision capacity
- Automatically scales with demand

### Lambda
- Configured with appropriate memory settings
- Uses ARM-based Graviton2 processors for better price/performance

### CloudFront
- Uses PRICE_CLASS_100 for US, Canada, and Europe only
- Enable compression for better performance

## Security Best Practices

1. **Least Privilege IAM** - Lambda functions only have required permissions
2. **Environment Isolation** - Separate stacks for dev/staging/prod
3. **Encryption** - DynamoDB encryption at rest enabled
4. **API Security** - API Gateway with proper CORS configuration

## Cleanup

To destroy a stack and all its resources:

```bash
# Destroy specific environment
cdk destroy --context env=dev

# Force destroy (skip confirmation)
cdk destroy --context env=dev --force
```

⚠️ **Warning**: This will delete all data in DynamoDB tables. Make sure to backup important data first.

## Advanced Topics

### Custom Resource Properties

Modify stack properties for specific requirements:

```typescript
// Increase Lambda timeout
timeout: cdk.Duration.seconds(30)

// Add environment variables
environment: {
  CUSTOM_VAR: 'value'
}

// Configure DynamoDB backups
pointInTimeRecovery: true
```

### Multi-Region Deployment

For deploying to multiple regions:

```bash
# Deploy to specific region
cdk deploy --context env=prod --context region=eu-west-1
```

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - General deployment instructions
- [CDK Simplification Guide](../guides/cdk-simplification.md) - Optimizing CDK code
- [Local CI/CD Sync Guide](../guides/local-cicd-sync.md) - Keeping deployments consistent
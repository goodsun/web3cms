import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface FullstackServerlessStackProps extends cdk.StackProps {
  projectName: string;
}

export class FullstackServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FullstackServerlessStackProps) {
    super(scope, id, props);

    // Get configuration from props and context
    const env = this.node.tryGetContext('env') || 'dev';
    const projectName = props.projectName;

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: env === 'prod',
      },
      tableName: `${projectName}-items-${env}`,
    });

    // Remove type-index first (will remove eoa-type-index in next deployment)
    table.addGlobalSecondaryIndex({
      indexName: 'eoa-type-index',
      partitionKey: {
        name: 'eoa',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Settings Table
    const settingsTable = new dynamodb.Table(this, 'SettingsTable', {
      partitionKey: {
        name: 'settingKey',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'version',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      tableName: `${projectName}-settings-${env}`,
    });

    // Columns Table for folders and contents
    const columnsTable = new dynamodb.Table(this, 'ColumnsTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: env === 'prod',
      },
      tableName: `${projectName}-columns-${env}`,
    });

    // Add type index for querying by type (folder/content)
    columnsTable.addGlobalSecondaryIndex({
      indexName: 'type-index',
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: {
        name: 'eoa',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: `${projectName}-users-${env}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // NFTs Table
    const nftsTable = new dynamodb.Table(this, 'NFTsTable', {
      partitionKey: {
        name: 'ca',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: `${projectName}-nfts-${env}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying NFTs by owner
    nftsTable.addGlobalSecondaryIndex({
      indexName: 'owner-index',
      partitionKey: {
        name: 'owner',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add GSI for querying NFTs by creator
    nftsTable.addGlobalSecondaryIndex({
      indexName: 'creator-index',
      partitionKey: {
        name: 'creator',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Lambda function for CRUD operations
    const crudLambda = new NodejsFunction(this, 'CrudHandler', {
      functionName: `${projectName}-crud-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/handlers/crud.ts'),
      environment: {
        TABLE_NAME: table.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
        NFTS_TABLE_NAME: nftsTable.tableName,
        REGION: this.region,
        ENV: env,
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      tracing: env === 'prod' ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
      bundling: {
        minify: env === 'prod',
        sourceMap: env !== 'prod',
        target: 'es2022',
      },
    });

    // Grant permissions to Lambda
    table.grantReadWriteData(crudLambda);
    usersTable.grantReadWriteData(crudLambda);
    nftsTable.grantReadWriteData(crudLambda);

    // Lambda function for Settings operations
    const settingsLambda = new NodejsFunction(this, 'SettingsHandler', {
      functionName: `${projectName}-settings-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/handlers/settings.ts'),
      environment: {
        SETTINGS_TABLE_NAME: settingsTable.tableName,
        REGION: this.region,
        ENV: env,
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: env === 'prod',
        sourceMap: env !== 'prod',
        target: 'es2022',
      },
    });

    // Grant permissions to Settings Lambda
    settingsTable.grantReadWriteData(settingsLambda);

    // Lambda function for Columns operations
    const columnsLambda = new NodejsFunction(this, 'ColumnsHandler', {
      functionName: `${projectName}-columns-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/handlers/columns.ts'),
      environment: {
        TABLE_NAME: columnsTable.tableName,
        REGION: this.region,
        ENV: env,
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      tracing: env === 'prod' ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
      bundling: {
        minify: env === 'prod',
        sourceMap: env !== 'prod',
        target: 'es2022',
      },
    });

    // Grant permissions to Columns Lambda
    columnsTable.grantReadWriteData(columnsLambda);

    // Lambda function for Users operations
    const usersLambda = new NodejsFunction(this, 'UsersHandler', {
      functionName: `${projectName}-users-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/handlers/users.ts'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        REGION: this.region,
        ENV: env,
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: env === 'prod',
        sourceMap: env !== 'prod',
        target: 'es2022',
      },
    });

    // Grant permissions to Users Lambda
    usersTable.grantReadWriteData(usersLambda);

    // Lambda function for NFTs operations
    const nftsLambda = new NodejsFunction(this, 'NFTsHandler', {
      functionName: `${projectName}-nfts-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/handlers/nfts.ts'),
      environment: {
        NFTS_TABLE_NAME: nftsTable.tableName,
        REGION: this.region,
        ENV: env,
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: env === 'prod',
        sourceMap: env !== 'prod',
        target: 'es2022',
      },
    });

    // Grant permissions to NFTs Lambda
    nftsTable.grantReadWriteData(nftsLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ItemsApi', {
      restApiName: `${projectName}-api-${env}`,
      description: 'API for CRUD operations',
      deployOptions: {
        stageName: env,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: env !== 'prod',
        metricsEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Lambda integration
    const integration = new apigateway.LambdaIntegration(crudLambda);
    const settingsIntegration = new apigateway.LambdaIntegration(settingsLambda);
    const columnsIntegration = new apigateway.LambdaIntegration(columnsLambda);
    const usersIntegration = new apigateway.LambdaIntegration(usersLambda);
    const nftsIntegration = new apigateway.LambdaIntegration(nftsLambda);

    // API endpoints
    const items = api.root.addResource('items');
    items.addMethod('GET', integration); // GET /items - List all items
    items.addMethod('POST', integration); // POST /items - Create new item

    const item = items.addResource('{id}');
    item.addMethod('GET', integration); // GET /items/{id} - Get specific item
    item.addMethod('PUT', integration); // PUT /items/{id} - Update item
    item.addMethod('DELETE', integration); // DELETE /items/{id} - Delete item

    // Settings endpoints
    const settings = api.root.addResource('settings');
    const setting = settings.addResource('{key}');
    setting.addMethod('GET', settingsIntegration); // GET /settings/{key}
    setting.addMethod('PUT', settingsIntegration); // PUT /settings/{key}

    // Columns endpoints
    const columns = api.root.addResource('columns');
    const columnsFolders = columns.addResource('folders');
    columnsFolders.addMethod('GET', columnsIntegration); // GET /columns/folders
    columnsFolders.addMethod('POST', columnsIntegration); // POST /columns/folders
    
    const columnsFolder = columnsFolders.addResource('{id}');
    columnsFolder.addMethod('GET', columnsIntegration); // GET /columns/folders/{id}
    columnsFolder.addMethod('PUT', columnsIntegration); // PUT /columns/folders/{id}
    columnsFolder.addMethod('DELETE', columnsIntegration); // DELETE /columns/folders/{id}
    
    const columnsContents = columns.addResource('contents');
    columnsContents.addMethod('GET', columnsIntegration); // GET /columns/contents
    columnsContents.addMethod('POST', columnsIntegration); // POST /columns/contents
    
    const columnsContent = columnsContents.addResource('{id}');
    columnsContent.addMethod('GET', columnsIntegration); // GET /columns/contents/{id}
    columnsContent.addMethod('PUT', columnsIntegration); // PUT /columns/contents/{id}
    columnsContent.addMethod('DELETE', columnsIntegration); // DELETE /columns/contents/{id}

    // Public columns endpoints (no authentication required)
    const columnsPublic = columns.addResource('public');
    const columnsPublicFolders = columnsPublic.addResource('folders');
    columnsPublicFolders.addMethod('GET', columnsIntegration); // GET /columns/public/folders
    
    const columnsPublicContents = columnsPublic.addResource('contents');
    columnsPublicContents.addMethod('GET', columnsIntegration); // GET /columns/public/contents
    
    const columnsPublicContent = columnsPublicContents.addResource('{id}');
    columnsPublicContent.addMethod('GET', columnsIntegration); // GET /columns/public/contents/{id}

    // Users endpoints
    const users = api.root.addResource('users');
    users.addMethod('GET', usersIntegration); // GET /users - List all users
    users.addMethod('POST', usersIntegration); // POST /users - Create new user
    
    const user = users.addResource('{eoa}');
    user.addMethod('GET', usersIntegration); // GET /users/{eoa} - Get specific user
    user.addMethod('PUT', usersIntegration); // PUT /users/{eoa} - Update user
    user.addMethod('DELETE', usersIntegration); // DELETE /users/{eoa} - Delete user

    // NFTs endpoints
    const nfts = api.root.addResource('nfts');
    nfts.addMethod('GET', nftsIntegration); // GET /nfts?owner={owner}&creator={creator} - Query NFTs
    nfts.addMethod('POST', nftsIntegration); // POST /nfts - Create new NFT
    
    const nftContract = nfts.addResource('{ca}');
    nftContract.addMethod('GET', nftsIntegration); // GET /nfts/{ca} - Get NFTs by contract
    
    const nftToken = nftContract.addResource('{id}');
    nftToken.addMethod('GET', nftsIntegration); // GET /nfts/{ca}/{id} - Get specific NFT
    nftToken.addMethod('PUT', nftsIntegration); // PUT /nfts/{ca}/{id} - Update NFT
    nftToken.addMethod('DELETE', nftsIntegration); // DELETE /nfts/{ca}/{id} - Delete NFT

    // S3 Bucket for frontend
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${projectName}-frontend-${env}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: env !== 'prod',
      versioned: env === 'prod',
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${projectName} ${env}`,
    });

    // Grant CloudFront access to S3 bucket
    websiteBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // Deploy frontend files to S3
    // If dist directory exists (after build), deploy from there. Otherwise, deploy from frontend
    const frontendPath = path.join(__dirname, '../../frontend');
    const distPath = path.join(frontendPath, 'dist');
    const deployPath = require('fs').existsSync(distPath) ? distPath : frontendPath;
    
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(deployPath)],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ColumnsTableName', {
      value: columnsTable.tableName,
      description: 'DynamoDB Columns Table Name',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users Table Name',
    });

    new cdk.CfnOutput(this, 'NFTsTableName', {
      value: nftsTable.tableName,
      description: 'DynamoDB NFTs Table Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
  }
}
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VPBankKMultStack } from '../lib/vpbank-kmult-stack';
import { CICDStack } from '../lib/cicd-stack';

const app = new cdk.App();

// Main infrastructure stack
const mainStack = new VPBankKMultStack(app, 'VPBankKMultStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
  },
  description: 'VPBank K-MULT Agent Studio - Multi-Agent Banking Automation Platform',
  tags: {
    Project: 'VPBank-KMULT',
    Environment: 'Production',
    Team: 'Multi-Agent-Hackathon-Group-181',
    CostCenter: 'Banking-Automation',
  },
});

// CI/CD Pipeline stack
const cicdStack = new CICDStack(app, 'VPBankKMultCICDStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
  },
  ecrRepository: mainStack.backendRepo,
  ecsService: mainStack.backendService.service,
  frontendBucket: mainStack.frontendBucket,
  description: 'CI/CD Pipeline for VPBank K-MULT Agent Studio',
});

// Add dependency
cicdStack.addDependency(mainStack);

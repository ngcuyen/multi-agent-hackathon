#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleVPBankStack } from '../lib/simple-stack';

const app = new cdk.App();

new SimpleVPBankStack(app, 'SimpleVPBankStack', {
  env: {
    account: '590183822512',
    region: 'us-east-1',
  },
  description: 'Simple VPBank K-MULT Infrastructure',
});

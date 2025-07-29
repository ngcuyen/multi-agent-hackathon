#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { ECSStack } from '../lib/ecs-stack';

const app = new cdk.App();

// Get existing VPC and Cluster from SimpleVPBankStack
const vpc = ec2.Vpc.fromLookup(app, 'ExistingVPC', {
  vpcId: 'vpc-0123456789abcdef0', // This will be replaced with actual VPC ID
});

const cluster = ecs.Cluster.fromClusterAttributes(app, 'ExistingCluster', {
  clusterName: 'vpbank-kmult',
  vpc: vpc,
});

new ECSStack(app, 'VPBankKMultECSStack', {
  env: {
    account: '590183822512',
    region: 'us-east-1',
  },
  vpc: vpc,
  cluster: cluster,
  ecrRepositoryUri: '590183822512.dkr.ecr.us-east-1.amazonaws.com/vpbank-kmult-backend:latest',
  description: 'VPBank K-MULT ECS Service Stack',
});

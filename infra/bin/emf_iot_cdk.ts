#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EMFIoTCdkStack } from '../lib/emf_iot_cdk';


const app = new cdk.App();
new EMFIoTCdkStack(app, 'EMFCDKIoTStack', {

});
import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {CfnPolicy, CfnTopicRule} from "@aws-cdk/aws-iot";
import * as aws_iam from "@aws-cdk/aws-iam";
import {LogGroup } from "@aws-cdk/aws-logs";
import {RetentionDays} from "@aws-cdk/aws-logs";

const CLIENT_ID = 'MyApp123';
const METRICS_PUB_TOPIC = `$aws/rules/emf/${CLIENT_ID}/logs`;
const METRICS_RULE_TOPIC = `$aws/rules/emf/+/logs`;
const LOG_GROUP_NAME = `${CLIENT_ID}_EMF_Logs`;

export class EMFIoTCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        new CfnPolicy(this, 'IoTPolicy', {
            policyName: 'MyApp123IoTPolicy',
            policyDocument: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect"
                        ],
                        "Resource": [
                            `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:client/\${iot:ClientId}`
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Publish"
                        ],
                        "Resource": [
                            `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/${METRICS_PUB_TOPIC}`
                        ]
                    }
                ]
            }
        });
        new LogGroup(this, 'LogGroup', {
            logGroupName: LOG_GROUP_NAME,
            retention: RetentionDays.ONE_MONTH
        });
        const CWRole = new aws_iam.Role(this, 'CWEMFRole', {
            assumedBy: new aws_iam.ServicePrincipal('iot.amazonaws.com'),
            inlinePolicies: {
                'cw-emf-policy': new aws_iam.PolicyDocument({
                    statements: [
                        new aws_iam.PolicyStatement({
                            actions: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            resources: [
                                `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:${LOG_GROUP_NAME}:*`
                            ]
                        })
                    ]
                })
            }
        });
        new CfnTopicRule(this, 'BasicIngestEMFIoTRule', {
            ruleName: 'emf',
            topicRulePayload: {
                actions: [
                    {
                        cloudwatchLogs: {
                            logGroupName: LOG_GROUP_NAME,
                            roleArn: CWRole.roleArn,
                            batchMode: true,
                        }
                    }
                ],
                description: 'IoT Rule',
                sql: `SELECT VALUE *.batch
                      FROM '${METRICS_RULE_TOPIC}'`,
                ruleDisabled: false,
                awsIotSqlVersion: '2016-03-23'
            }
        });
    }
}

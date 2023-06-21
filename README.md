## Batch Ingestion and Routing of Embedded Metric Format (EMF) IoT Device Metrics to Amazon CloudWatch

This sample shows how to use an IoT Device simulator to generate device metrics in EMF format and AWS IoT Core Rules Engine to Batch Ingest and Route Embedded Metric Format (EMF) Logs to Amazon CloudWatch. 
From these logs, Amazon CloudWatch will automatically extract the metrics which will be available in CloudWatch Metrics for viewing, creating charts and configuring alarms.

For more information about this approach, have a look at the Blog Post: 
<Link here>

## Set-Up 

To run this demo, clone the repo: https://github.com/aws-iot-builder-tools/emf-metrics-with-iot-rules

This repository is composed of two folders:

* `app` - containing the application code and configuration.
* `infra` - containing the infrastructure CDK code and configuration.

You will need both to set up the demo.

To run the demo, the following steps should be performed:

**1. Deploy the required AWS resources:**

The AWS resources for this demo are created and deployed using AWS CDK. The CDK Typescript code creates and deploys:

* An IoT device policy, allowing the device to connect to AWS IoT Core and publish data on the Basic Ingest Rule topic. This policy looks as below:

`{
"Version": "2012-10-17",
"Statement": [
{
"Action": [
"iot:Connect"
],
"Resource": [
"arn:aws:iot:<AWS_REGION>:<AWS_ACCOUNT>:client/${iot:ClientId}"
],
"Effect": "Allow"
},
{
"Action": [
"iot:Publish"
],
"Resource": [
"arn:aws:iot:<AWS_REGION>:<AWS_ACCOUNT>:topic/$aws/rules/emf/${iot:ClientId}/logs"
],
"Effect": "Allow"
}
]
}
`
* An IoT Rule for Basic Ingest, configured with an action to batch ingest log entries into Amazon CloudWatch.
* An IAM Role with the correct IAM policy allowing the IoT Rule to ingest into CloudWatch.

**Pre-requisites:**

* You must have AWS CDK installed and configured with the required credentials for your AWS Account. For help with this, follow https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html

**Steps:**

1. In the infra  directory , run npm run build
2. Run cdk deploy

**2. Run the IoT Device Simulation Application:**

The IoT application connects to AWS IoT Core using an MQTT client implemented with MQTT.js, reads operating system metrics on a sampling interval of 5 seconds, stores them in an in-memory array and ingests them in batches at a reporting interval of 15 seconds. In the app folder, there is also a utility function which, in an idempotent manner, creates the IoT thing, certificate and keys.

**Pre-requisites:**

To run the IoT application, you need to ensure:

* That your application has the correct credentials to make calls to AWS IoT to create the IoT thing, certificate and keys.  More info: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html
* That the correct AWS Region is also configured.

**Steps:**

1. Fill in config.js with your IoT endpoint configuration:
`export const config = {
iotEndpoint: "<YOUR_AWS_IOT_ENDPOINT>",
region: "<YOUR_AWS_REGION>"
}`
2. Run `npm install` in the `app` directory.
3. Run `node app.js`

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.


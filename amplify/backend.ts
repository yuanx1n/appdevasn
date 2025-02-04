import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Stack, CfnOutput } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { postConfirmation } from './functions/postConfirmation/resource';
import { myDynamoDBFunction } from './functions/postConfirmation/dynamoDB-function/resource';
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";


const backend = defineBackend({
  auth,
  data,
  //add s3 storage here
  storage,
  postConfirmation,
  myDynamoDBFunction,
});


// ✅ Attach Cognito Group Management Policy to PostConfirmation Lambda
(() => {
  const postConfirmationLambda = backend.postConfirmation.resources.lambda;

  const cognitoPolicyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: ["arn:aws:cognito-idp:us-east-1:314146339169:userpool/us-east-1_5YmVpKkpb"], // Replace with actual values
  });

  postConfirmationLambda.addToRolePolicy(cognitoPolicyStatement);
})();

// 📌 Create SNS Topic for Lost Item Notifications
const stack = backend.stack as Stack;
const lostItemTopic = new sns.Topic(stack, "LostItemNotificationTopic-test", {
  displayName: "Lost Item Notifications-test",
  topicName: "LostItemTopic-test",
});
// ✅ Export SNS Topic ARN
new CfnOutput(stack, "LostItemTopicArn-test", {
  value: lostItemTopic.topicArn,
  exportName: "LostItemTopicArn-test",
});
// 📌 Ensure LostItem Table has Streams Enabled
const lostItemTable = backend.data.resources.tables["LostItem"];
// ✅ Grant Lambda permission to read DynamoDB stream
const dynamoDBStreamPolicy = new Policy(Stack.of(lostItemTable), "DynamoDBStreamPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      resources: [lostItemTable.tableStreamArn!], // Ensure correct stream ARN
    }),
  ],
});
backend.myDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(dynamoDBStreamPolicy);
// ✅ Grant Lambda permission to publish to SNS
const snsPublishPolicy = new Policy(Stack.of(lostItemTable), "SNSPublishPolicy-test", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["sns:Publish"],
      resources: [lostItemTopic.topicArn],
    }),
  ],
});
backend.myDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(snsPublishPolicy);
// 📌 Attach Environment Variable for SNS Topic ARN
backend.myDynamoDBFunction.addEnvironment("SNS_TOPIC_ARN", lostItemTopic.topicArn);
// ✅ Attach DynamoDB Stream to Lambda function
const mapping = new EventSourceMapping(Stack.of(lostItemTable), "LostItemStreamMapping-test", {
  target: backend.myDynamoDBFunction.resources.lambda,
  eventSourceArn: lostItemTable.tableStreamArn,
  startingPosition: StartingPosition.LATEST,
});
mapping.node.addDependency(dynamoDBStreamPolicy);
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Stack, CfnOutput } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { postConfirmation } from './functions/postConfirmation/resource';
import { myDynamoDBFunction } from './functions/dynamoDB-function/resource';
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { categoryDynamoDBFunction } from './functions/categoryDynamoDB-function/resource';


const backend = defineBackend({
  auth,
  data,
  storage, // Ensure storage is included
  postConfirmation,
  myDynamoDBFunction, // Add the DynamoDB stream handler function
  categoryDynamoDBFunction, // Add the DynamoDB stream handler function
});


// ✅ Attach Cognito Group Management Policy to PostConfirmation Lambda
(() => {
  const postConfirmationLambda = backend.postConfirmation.resources.lambda;

  const cognitoPolicyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: ["arn:aws:cognito-idp:us-east-1:314146339169:userpool/us-east-1_yr1ZwdDQN"], // Replace with actual values
  });

  postConfirmationLambda.addToRolePolicy(cognitoPolicyStatement);
})();

// 📌 Create SNS Topic for Lost Item Notifications
const stack = backend.stack as Stack;
const lostItemTopic = new sns.Topic(stack, "LostItemNotificationTopic", {
  displayName: "Lost Item Notifications",
  topicName: "LostItemTopic",
});

// 📌 Create SNS Topic for Category-Specific Notifications
const categoryTopic = new sns.Topic(stack, "CategoryNotificationTopic", {
  displayName: "Category-Specific Notifications",
  topicName: "CategoryNotificationTopic",
});

// ✅ Export SNS Topic ARN
new CfnOutput(stack, "LostItemTopicArn", {
  value: lostItemTopic.topicArn,
  exportName: "LostItemTopicArn",
});

// ✅ Export Category SNS Topic ARN
new CfnOutput(stack, "CategoryTopicArn", {
  value: categoryTopic.topicArn,
  exportName: "CategoryTopicArn",
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

// Attach DynamoDB stream permission to both DynamoDB functions
backend.myDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(dynamoDBStreamPolicy);
backend.categoryDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(dynamoDBStreamPolicy);

// ✅ Grant Lambda permission to publish to both SNS topics
const snsPublishPolicy = new Policy(Stack.of(lostItemTable), "SNSPublishPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["sns:Publish"],
      resources: [lostItemTopic.topicArn, categoryTopic.topicArn], // Allow both topics
    }),
  ],
});

// Attach SNS publish permission to both DynamoDB functions
backend.myDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(snsPublishPolicy);
backend.categoryDynamoDBFunction.resources.lambda.role?.attachInlinePolicy(snsPublishPolicy);


// 📌 Attach Environment Variable for SNS Topic ARN
backend.myDynamoDBFunction.addEnvironment("SNS_TOPIC_ARN", lostItemTopic.topicArn);


// 📌 Attach Environment Variable for Category SNS Topic ARN to categoryDynamoDBFunction
backend.categoryDynamoDBFunction.addEnvironment("SNS_CATEGORY_TOPIC_ARN", categoryTopic.topicArn);



// ✅ Attach DynamoDB Stream to both Lambda functions
const mapping = new EventSourceMapping(Stack.of(lostItemTable), "LostItemStreamMapping", {
  target: backend.myDynamoDBFunction.resources.lambda,
  eventSourceArn: lostItemTable.tableStreamArn,
  startingPosition: StartingPosition.LATEST,
});

const mappingForCategoryDynamoDBFunction = new EventSourceMapping(Stack.of(lostItemTable), "LostItemStreamMappingForCategoryDynamoDB", {
  target: backend.categoryDynamoDBFunction.resources.lambda,
  eventSourceArn: lostItemTable.tableStreamArn,
  startingPosition: StartingPosition.LATEST,
});


mapping.node.addDependency(dynamoDBStreamPolicy);
mappingForCategoryDynamoDBFunction.node.addDependency(dynamoDBStreamPolicy);

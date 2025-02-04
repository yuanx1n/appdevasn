import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Stack } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { postConfirmation } from './functions/postConfirmation/resource';

const backend = defineBackend({
  auth,
  data,
  //add s3 storage here
  storage,
  postConfirmation,
});

// ✅ Attach Cognito Group Management Policy to PostConfirmation Lambda
(() => {
  const postConfirmationLambda = backend.postConfirmation.resources.lambda;
  const userPoolArn = backend.auth.resources.userPool.userPoolArn;
  console.log("User Pool ARN:",userPoolArn);

  const cognitoPolicyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: [userPoolArn],
  });

  postConfirmationLambda.addToRolePolicy(cognitoPolicyStatement);
})();

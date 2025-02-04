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

  const cognitoPolicyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: ["arn:aws:cognito-idp:us-east-1:314146339169:userpool/us-east-1_5YmVpKkpb"], // Replace with actual values
  });

  postConfirmationLambda.addToRolePolicy(cognitoPolicyStatement);
})();

import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PostConfirmationTriggerEvent } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" }); // Change to your AWS region

// Initialize Amplify configuration
Amplify.configure({
  // Add your necessary Amplify configuration here
  aws_project_region: 'us-east-1',
  // other config...
});

const client = generateClient<Schema>();

export const handler = async (event: PostConfirmationTriggerEvent) => {
  console.log("PostConfirmation Trigger Event:", JSON.stringify(event, null, 2));

  // Add the user to the "User" group in Cognito
  const userPoolId = event.userPoolId;
  const username = event.userName;
  const groupName = "User"; // Default group

  const cognitoParams = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  try {
    const command = new AdminAddUserToGroupCommand(cognitoParams);
    await cognitoClient.send(command);
    console.log(`✅ User ${username} added to group ${groupName}`);
  } catch (error) {
    console.error("❌ Error adding user to group:", error);
  }

  // Create the UserProfile in Amplify DataStore
  try {
    await client.models.UserProfile.create({
      email: event.request.userAttributes.email,
      profileOwner: `${event.request.userAttributes.sub}::${event.userName}`,
    });
    console.log(`✅ UserProfile created for ${username}`);
  } catch (error) {
    console.error("❌ Error creating UserProfile:", error);
  }

  return event; // Required for Amplify triggers
};

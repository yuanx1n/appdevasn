import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PostConfirmationTriggerEvent } from "aws-lambda"; // Import the correct event type

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" }); // Change to your AWS region

export const handler = async (event: PostConfirmationTriggerEvent) => {
  console.log("PostConfirmation Trigger Event:", JSON.stringify(event, null, 2));

  const userPoolId = event.userPoolId;
  const username = event.userName;
  const groupName = "User"; // Default group

  const params = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  try {
    const command = new AdminAddUserToGroupCommand(params);
    await cognitoClient.send(command);
    console.log(`✅ User ${username} added to group ${groupName}`);
  } catch (error) {
    console.error("❌ Error adding user to group:", error);
  }

  return event; // Required for Amplify triggers
};
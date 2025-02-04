import type { Schema } from "../resource"

import amplifyOutputs from "../../../amplify_outputs.json"
import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider"

type Handler = Schema["addUserToGroup"]["functionHandler"]
const client = new CognitoIdentityProviderClient()

export const handler: Handler = async (event) => {
  const { userId, groupName } = event.arguments
  const command = new AdminAddUserToGroupCommand({
    Username: userId,
    GroupName: "User",
    UserPoolId: amplifyOutputs.auth.user_pool_id,
  })
  const response = await client.send(command)
  return response
}
import { defineFunction } from "@aws-amplify/backend";

export const categoryDynamoDBFunction = defineFunction({
  name: "categoryDynamoDB-function",
  entry: './handler.ts', // Points to the file containing the handler
});

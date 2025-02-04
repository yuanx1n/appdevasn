import { defineFunction } from "@aws-amplify/backend";

export const myDynamoDBFunction = defineFunction({
  name: "dynamoDB-function",
  entry: './handler.ts', // Points to the file containing the handler
});

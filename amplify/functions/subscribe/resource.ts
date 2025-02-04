import { defineFunction } from "@aws-amplify/backend";
export const subscribe = defineFunction({
  name: "subscribe",
  entry: './handler.ts', // Points to the file containing the handler
});
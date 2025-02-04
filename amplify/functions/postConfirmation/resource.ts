import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'postConfirmation', // Optional: defaults to directory name
  entry: './postConfirmation.ts', // Points to the file containing the handler
});
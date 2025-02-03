import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'appdevlostnfoundbucket',
  access: (allow) => ({
    'uploads/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read','write']),
      allow.groups(["User"]).to(["read", "write"]),
      allow.groups(["Admin"]).to(["read", "write"]),
    ],
  })
});
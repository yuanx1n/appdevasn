import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from '../functions/postConfirmation/resource';
/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },

  //user groups admin and user
  groups: ['Admin', 'User'],
    
  // triggers: {
  //   postConfirmation,
  // },

});

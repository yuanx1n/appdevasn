import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import type { Schema } from '../../data/resource';

const snsClient = new SNSClient({ region: 'us-east-1' });

interface SubscribeEvent {
  email: string;
  category: string;  
}

type Handler = Schema["subscribe"]["functionHandler"];

export const handler: Handler = async (event) => {
    const email = event.arguments.email;
    const category = event.arguments.category;
    console.log(`Received subscription request for ${email} in category ${category}`);
    if (!email) {
        throw new Error("Email is required for subscription.");
    }

    try {
        // Base parameters
        const params = {
          Protocol: 'email' as const,
          TopicArn: process.env.SNS_TOPIC_ARN,
          Endpoint: email,
          // Filter policy goes in Attributes
          Attributes: {
            FilterPolicy: JSON.stringify(
              category 
                ? { category: [category] }  // Specific category
                : { category: ['*'] }       // Wildcard to allow all
            )
          }
        };

        await snsClient.send(new SubscribeCommand(params));
        console.log(`Subscription confirmation sent to ${email}`);
        return;
      } catch (error) {
        console.error('Subscription error:', error);
        throw new Error('Failed to process subscription request');
      }
};
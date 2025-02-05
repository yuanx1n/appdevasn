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
    const category = event.arguments.category; // Retrieve category from event arguments

    if (!email) {
        throw new Error("Email is required for subscription.");
    }

    try {
        const params: any = {
          Protocol: 'email',
          TopicArn: process.env.SNS_TOPIC_ARN,
          Endpoint: email,
        };
    
        if (category && category !== '') {
          params.MessageAttributes = {
            'Category': {
              DataType: 'String',
              StringValue: category,
            },
          };
    
          // Add a filter policy for category subscription
          params.FilterPolicy = JSON.stringify({
            Category: [category],  // Filter based on the category
          });
        } else {
          // If no category is provided, subscribe to all messages
          params.FilterPolicy = JSON.stringify({
            Category: ['*'],  // Wildcard to allow all categories
          });
        }
    
        await snsClient.send(new SubscribeCommand(params));
        console.log(`Subscription confirmation sent to ${email}`);
        return; // Change from returning a string to void
      } catch (error) {
        console.error('Subscription error:', error);
        throw new Error('Failed to process subscription request');
      }
    };
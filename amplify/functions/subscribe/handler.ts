import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import type { Schema } from '../../data/resource';

const snsClient = new SNSClient({ region: 'us-east-1' });

interface SubscribeEvent {
  email: string;
  category: string;
}
type Handler = Schema["subscribe"]["functionHandler"]

export const handler: Handler = async (event) => {
    const email = event.arguments.email;
    let category = event.arguments.category;

    if (!email) {
        throw new Error("Email is required for subscription.");
    }

    // If category is an empty string, set it to undefined
    if (category === '') {
        category = undefined;
    }

    try {
        const params = {
            Protocol: 'email',
            TopicArn: process.env.SNS_TOPIC_ARN,
            Endpoint: email,
            // Add category as a message attribute, only if it's defined
            Attributes: category ? { 'Category': category } : undefined,
        };

        await snsClient.send(new SubscribeCommand(params));
        console.log(`Subscription confirmation sent to ${email}`);

        return; // Return nothing on success
    } catch (error) {
        console.error('Subscription error:', error);
        throw new Error('Failed to process subscription request');
    }
};

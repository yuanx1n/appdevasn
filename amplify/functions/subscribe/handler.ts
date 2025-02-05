import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import type { Schema } from '../../data/resource';


const snsClient = new SNSClient({ region: 'us-east-1' });

interface SubscribeEvent {
  email: string;
}
type Handler = Schema["subscribe"]["functionHandler"]

export const handler: Handler = async (event) => {
    const email = event.arguments.email;
    if (!email) {
        throw new Error("Email is required for subscription.");
    }
    try {
        const params = {
            Protocol: 'email',
            TopicArn: process.env.SNS_TOPIC_ARN,
            Endpoint: email,
        };

        await snsClient.send(new SubscribeCommand(params));
        console.log(`Subscription confirmation sent to ${email}`);

        return; // Change from returning a string to void
    } catch (error) {
        console.error('Subscription error:', error);
        throw new Error('Failed to process subscription request');
    }
};


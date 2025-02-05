import { ListSubscriptionsByTopicCommand, SetSubscriptionAttributesCommand, SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import type { Schema } from '../../data/resource';

const snsClient = new SNSClient({ region: 'us-east-1' });

interface SubscribeEvent {
  email?: string;
  category?: string;  
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
        const topicArn = process.env.SNS_TOPIC_ARN;
        
        // Check for existing subscription
        const listParams = { TopicArn: topicArn };
        const subscriptions = await snsClient.send(new ListSubscriptionsByTopicCommand(listParams));
        
        // Find existing subscription for this email
        const existingSub = subscriptions.Subscriptions?.find(
            sub => sub.Endpoint === email && sub.SubscriptionArn !== 'PendingConfirmation'
        );

        const filterPolicy = category ? { category: [category] } : { category: ['*'] };
        const filterPolicyString = JSON.stringify(filterPolicy);

        if (existingSub?.SubscriptionArn) {
            // Update existing subscription attributes
            await snsClient.send(new SetSubscriptionAttributesCommand({
                SubscriptionArn: existingSub.SubscriptionArn,
                AttributeName: 'FilterPolicy',
                AttributeValue: filterPolicyString
            }));
            console.log(`Updated filter policy for existing subscription: ${email}`);
        } else {
            // Create new subscription
            await snsClient.send(new SubscribeCommand({
                Protocol: 'email',
                TopicArn: topicArn,
                Endpoint: email,
                Attributes: {
                    FilterPolicy: filterPolicyString
                }
            }));
            console.log(`New subscription confirmation sent to: ${email}`);
        }
    } catch (error) {
        console.error('Subscription error:', error);
        throw new Error('Failed to process subscription request');
    }
};

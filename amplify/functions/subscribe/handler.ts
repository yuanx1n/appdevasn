import { 
    ListSubscriptionsByTopicCommand, 
    SetSubscriptionAttributesCommand, 
    SNSClient, 
    SubscribeCommand 
} from '@aws-sdk/client-sns';
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
    
    if (!email) {
        throw new Error("Email is required for subscription.");
    }

    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
        throw new Error("SNS_TOPIC_ARN is not set in the environment variables.");
    }

    console.log(`Received subscription request for ${email} in category ${category}`);
    console.log(`Using topic ARN: ${topicArn}`);

    try {
        // Fetch existing subscriptions for this topic
        const listParams = { TopicArn: topicArn };
        const subscriptions = await snsClient.send(new ListSubscriptionsByTopicCommand(listParams));
        console.log('Fetched subscriptions:', JSON.stringify(subscriptions, null, 2));

        // Find an existing subscription for this email
        const existingSub = subscriptions.Subscriptions?.find(
            sub => sub.Endpoint === email && sub.SubscriptionArn && sub.SubscriptionArn !== 'PendingConfirmation'
        );

        console.log(`Existing subscription for ${email}: ${existingSub?.SubscriptionArn}`);

        // Construct the filter policy
        const filterPolicy = category ? { category: [category] } : { category: ['*'] };
        const filterPolicyString = JSON.stringify(filterPolicy);

        if (existingSub?.SubscriptionArn && existingSub.SubscriptionArn.split(":").length >= 6) {
            // Update the existing subscription with the new filter policy
            await snsClient.send(new SetSubscriptionAttributesCommand({
                SubscriptionArn: existingSub.SubscriptionArn,
                AttributeName: 'FilterPolicy',
                AttributeValue: filterPolicyString
            }));
            console.log(`Updated filter policy for existing subscription: ${email}`);
        } else {
            // Create a new subscription
            console.log(`No valid existing subscription found for ${email}. Creating a new one.`);
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

import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { Handler } from 'aws-lambda';

const snsClient = new SNSClient({ region: 'us-east-1' });

interface SubscribeEvent {
  email: string;
}

export const handler: Handler<SubscribeEvent> = async (event) => {
  try {
    const params = {
      Protocol: 'email',
      TopicArn: process.env.SNS_TOPIC_ARN,
      Endpoint: event.email
    };

    await snsClient.send(new SubscribeCommand(params));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Subscription confirmation sent to your email'
      })
    };
  } catch (error) {
    console.error('Subscription error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process subscription request'
      })
    };
  }
};
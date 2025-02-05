import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { SNSClient, PublishCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "dynamodb-stream-handler",
});

const snsClient = new SNSClient({ region: "us-east-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    logger.info(`Processing record: ${record.eventID}`);
    logger.info(`Event Type: ${record.eventName}`);

    if (record.eventName === "INSERT") {
      const newItem = record.dynamodb?.NewImage;
      if (!newItem) continue;

      const name = newItem.name?.S || "Unknown";
      const location = newItem.location?.S || "Unknown";
      const date = newItem.date?.S || "Unknown";
      const category = newItem.category?.S || null; // Allow null or undefined category

      const message = `🔔 New Lost Item Found!\n📌 Name: ${name}\n📍 Location: ${location}\n📅 Date: ${date}\n📂 Category: ${category || "General"}`;

      // Get the subscriptions for the topic
      const subscriptions = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: SNS_TOPIC_ARN })
      );

      for (const subscription of subscriptions.Subscriptions || []) {
        const subscriptionCategory = subscription.Endpoint; // Assume you're filtering based on subscription's endpoint or logic here

        // Send the message if category is null/undefined or if it matches the subscription category
        if (category === null || category === undefined || subscriptionCategory === category) {
          try {
            const publishResponse = await snsClient.send(
              new PublishCommand({
                Message: message,
                TopicArn: SNS_TOPIC_ARN,
                MessageAttributes: category
                  ? { Category: { DataType: "String", StringValue: category } }
                  : {},
              })
            );

            // Log the response of the PublishCommand
            logger.info(`SNS Publish Response: ${JSON.stringify(publishResponse)}`);
          } catch (error) {
            logger.error(`Error publishing SNS message: ${(error as Error).message}`);
          }
        }
      }
    }
  }

  logger.info(`Successfully processed ${event.Records.length} records.`);
  return { batchItemFailures: [] };
};

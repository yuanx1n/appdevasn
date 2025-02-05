import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "dynamodb-stream-handler",
});

const snsClient = new SNSClient({ region: "us-east-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN; // Set from backend.ts

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    logger.info(`Processing record: ${record.eventID}`);
    logger.info(`Event Type: ${record.eventName}`);

    if (record.eventName === "INSERT") {
      // Extract new LostItem details
      const newItem = record.dynamodb?.NewImage;
      if (!newItem) continue;

      const name = newItem.name?.S || "Unknown";
      const location = newItem.location?.S || "Unknown";
      const date = newItem.date?.S || "Unknown";
      const category = newItem.category?.S || "General";  // Default to "General" if no category

      const message = `🔔 New Lost Item Found!\n📌 Name: ${name}\n📍 Location: ${location}\n📅 Date: ${date}\n📂 Category: ${category}`;

      try {
        // Publish message to SNS with category as a message attribute
        const response = await snsClient.send(
          new PublishCommand({
            Message: message,
            TopicArn: SNS_TOPIC_ARN,
            MessageAttributes: {
              'category': {
                DataType: 'String',
                StringValue: category,
              },
            },
          })
        );
        
        logger.info(`SNS Publish Response: ${JSON.stringify(response)}`);
      } catch (error) {
        logger.error(`Error publishing SNS message: ${(error as Error).message}`);
      }
    }
  }

  logger.info(`Successfully processed ${event.Records.length} records.`);
  return { batchItemFailures: [] };
};

import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize the logger
const logger = new Logger({
  logLevel: "INFO",
  serviceName: "category-dynamodb-stream-handler",
});

// Initialize SNS Client
const snsClient = new SNSClient({ region: "us-east-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN; // Set from backend.ts

// User-specified category to be notified about
const SPECIFIED_CATEGORY = process.env.SPECIFIED_CATEGORY || "Unknown";

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    logger.info(`Processing record: ${record.eventID}`);
    logger.info(`Event Type: ${record.eventName}`);

    if (record.eventName === "INSERT") {
      // Extract new LostItem details from DynamoDB Stream
      const newItem = record.dynamodb?.NewImage;
      if (!newItem) continue;

      const name = newItem.name?.S || "Unknown";
      const location = newItem.location?.S || "Unknown";
      const date = newItem.date?.S || "Unknown";
      const category = newItem.category?.S || "Unknown";

      const message = `🔔 New Lost Item Found!\n📌 Name: ${name}\n📍 Location: ${location}\n📅 Date: ${date}\n📂 Category: ${category}`;

      // Check if the category matches the user-specified category
      if (category === SPECIFIED_CATEGORY) {
        try {
          // Publish message to SNS Topic
          const response = await snsClient.send(
            new PublishCommand({
              Message: message,
              TopicArn: SNS_TOPIC_ARN,
            })
          );

          logger.info(`SNS Publish Response: ${JSON.stringify(response)}`);
        } catch (error) {
          logger.error(`Error publishing SNS message: ${(error as Error).message}`);
        }
      } else {
        logger.info(`Category does not match the specified category: ${category}`);
      }
    }
  }

  logger.info(`Successfully processed ${event.Records.length} records.`);
  return { batchItemFailures: [] };
};

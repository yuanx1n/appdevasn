import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const logger = new Logger({
  logLevel: "INFO",
  serviceName: "dynamodb-stream-handler",
});
const snsClient = new SNSClient({ region: "us-east-1" }); // Change to your region
//hardcode topic arn when sns is created
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
      const message = `🔔 New Lost Item Found!\n📌 Name: ${name}\n📍 Location: ${location}\n📅 Date: ${date}`;
      try {
        // Publish message to SNS
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
    }
  }
  logger.info(`Successfully processed ${event.Records.length} records.`);
  return { batchItemFailures: [] };
};
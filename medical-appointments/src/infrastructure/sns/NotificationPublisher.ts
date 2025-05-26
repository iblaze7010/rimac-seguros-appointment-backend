import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Appointment } from "../../domain/models/appointment";

// Initialize SNS client with default configuration
const snsClient = new SNSClient({});

/**
 * Publishes an appointment message to the configured SNS topic.
 *
 * @param appointment - The appointment object to be published.
 * @throws Will throw an error if the SNS publish operation fails.
 */
export async function publishAppointment(
  appointment: Appointment
): Promise<void> {
  const TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
  const message = JSON.stringify(appointment);

  const command = new PublishCommand({
    TopicArn: TOPIC_ARN,
    Message: message,
    MessageAttributes: {
      countryISO: {
        DataType: "String",
        StringValue: appointment.countryISO,
      },
    },
  });

  await snsClient.send(command);
}

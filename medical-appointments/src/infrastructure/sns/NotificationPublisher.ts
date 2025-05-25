// src/infrastructure/sns/SnsPublisher.ts

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Appointment } from "../../domain/models/appointment";

const snsClient = new SNSClient({});

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

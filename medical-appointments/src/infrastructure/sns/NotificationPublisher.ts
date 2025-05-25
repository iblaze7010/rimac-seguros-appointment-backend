import { SNS } from "aws-sdk";
import { Appointment } from "../../domain/models/appointment";

const sns = new SNS();

export async function publishAppointment(
  appointment: Appointment
): Promise<void> {
  const TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
  const message = JSON.stringify(appointment);

  await sns
    .publish({
      TopicArn: TOPIC_ARN,
      Message: message,
      MessageAttributes: {
        countryISO: {
          DataType: "String",
          StringValue: appointment.countryISO,
        },
      },
    })
    .promise();
}

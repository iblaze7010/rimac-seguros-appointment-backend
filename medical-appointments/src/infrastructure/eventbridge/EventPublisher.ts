import { EventBridge } from "aws-sdk";
import { Appointment } from "../../domain/models/appointment";

const eventbridge = new EventBridge();

export async function publishAppointmentCompleted(
  appointment: Appointment
): Promise<void> {
  const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

  await eventbridge
    .putEvents({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source: "appointment.app",
          DetailType: "AppointmentCompleted",
          Detail: JSON.stringify(appointment),
        },
      ],
    })
    .promise();
}

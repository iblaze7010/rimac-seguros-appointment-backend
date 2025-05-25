import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { Appointment } from "../../domain/models/appointment";

const eventbridgeClient = new EventBridgeClient({});

export async function publishAppointmentCompleted(
  appointment: Appointment
): Promise<void> {
  const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: "appointment.app",
        DetailType: "AppointmentCompleted",
        Detail: JSON.stringify(appointment),
      },
    ],
  });

  await eventbridgeClient.send(command);
}

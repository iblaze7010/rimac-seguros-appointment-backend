import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { Appointment } from "../../domain/models/appointment";

// Initialize EventBridge client with default configuration
const eventbridgeClient = new EventBridgeClient({});

/**
 * Publishes an "AppointmentCompleted" event to the specified EventBridge bus.
 *
 * @param appointment - The appointment object to publish as event detail.
 * @throws Throws an error if the event publishing fails.
 */
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

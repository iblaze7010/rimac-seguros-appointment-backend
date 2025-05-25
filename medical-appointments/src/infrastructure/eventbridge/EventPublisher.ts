import { EventBridge } from 'aws-sdk';
import { Appointment } from '../../domain/models/appointment';

const eventbridge = new EventBridge();
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export async function publishAppointmentCompleted(appointment: Appointment): Promise<void> {
  await eventbridge.putEvents({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'appointment.app',
        DetailType: 'AppointmentCompleted',
        Detail: JSON.stringify(appointment),
      },
    ],
  }).promise();
}

import { SQSEvent, SQSHandler } from 'aws-lambda';
import { saveAppointmentRDS } from '../infrastructure/rds/AppointmentRepositoryRDS';
import { publishAppointmentCompleted } from '../infrastructure/eventbridge/EventPublisher';
import { Appointment } from '../domain/models/appointment';

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const appointment: Appointment = JSON.parse(record.body);
    try {
      await saveAppointmentRDS(appointment);

      await publishAppointmentCompleted(appointment);
    } catch (error) {
      console.error('Error processing PE appointment:', error);
      throw error; 
    }
  }
};

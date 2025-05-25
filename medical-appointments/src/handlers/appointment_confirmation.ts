import { SQSHandler, SQSEvent } from 'aws-lambda';
import { updateAppointmentStatus } from '../infrastructure/dynamodb/AppointmentRepository';
import { Appointment, AppointmentStatus } from '../domain/models/appointment';

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const appointment: Appointment = JSON.parse(record.body);
    try {
      await updateAppointmentStatus(appointment.id, AppointmentStatus.Completed);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }
};

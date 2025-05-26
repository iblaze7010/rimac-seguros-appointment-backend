import { SQSEvent, SQSHandler } from "aws-lambda";
import { updateAppointmentStatus } from "../infrastructure/dynamodb/AppointmentRepository";
import { Appointment, AppointmentStatus } from "../domain/models/appointment";

/**
 * SQS handler that processes appointment completion events.
 * For each record, it extracts the appointment detail and updates its status to Completed.
 *
 * @param event - SQSEvent containing appointment completion events
 * @throws Error if updating the appointment status fails
 */
export const processCompletionFromSQS: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const eventDetail = JSON.parse(record.body);
    const appointment: Appointment = eventDetail.detail;
    try {
      await updateAppointmentStatus(
        appointment.id,
        AppointmentStatus.Completed
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
  }
};

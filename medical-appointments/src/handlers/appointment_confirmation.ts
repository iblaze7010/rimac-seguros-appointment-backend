import { SQSEvent, SQSHandler } from "aws-lambda";
import { updateAppointmentStatus } from "../infrastructure/dynamodb/AppointmentRepository";
import { Appointment, AppointmentStatus } from "../domain/models/appointment";

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

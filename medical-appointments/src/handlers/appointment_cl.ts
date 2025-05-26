import { SQSEvent, SQSHandler } from "aws-lambda";
import { saveAppointmentRDS } from "../infrastructure/rds/AppointmentRepositoryRDS";
import { publishAppointmentCompleted } from "../infrastructure/eventbridge/EventPublisher";
import { Appointment } from "../domain/models/appointment";

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.body);
    const appointment: Appointment = JSON.parse(snsMessage.Message);
    try {
      await saveAppointmentRDS(appointment);

      await publishAppointmentCompleted(appointment);
    } catch (error) {
      console.error("Error processing CL appointment:", error);
      throw error;
    }
  }
};

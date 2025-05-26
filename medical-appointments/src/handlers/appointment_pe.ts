import { SQSEvent, SQSHandler } from "aws-lambda";
import { saveAppointmentRDS } from "../infrastructure/rds/AppointmentRepositoryRDS";
import { publishAppointmentCompleted } from "../infrastructure/eventbridge/EventPublisher";
import { Appointment } from "../domain/models/appointment";

/**
 * SQS handler to process PE appointment messages from the queue.
 * For each record, parses the SQS message, saves the appointment in RDS,
 * and publishes an event indicating completion.
 *
 * @param event - SQSEvent containing SQS records with appointment messages
 * @throws Error if saving the appointment or publishing the event fails
 */
export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.body);
    const appointment: Appointment = JSON.parse(snsMessage.Message);
    try {
      await saveAppointmentRDS(appointment);

      await publishAppointmentCompleted(appointment);
    } catch (error) {
      console.error("Error processing PE appointment:", error);
      throw error;
    }
  }
};

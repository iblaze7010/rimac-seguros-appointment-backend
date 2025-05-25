import { APIGatewayProxyHandler, SQSEvent, SQSHandler } from "aws-lambda";
import { createAppointment } from "../application/scheduleAppointment";
import {
  saveAppointment,
  getAppointmentsByInsuredId,
  updateAppointmentStatus,
} from "../infrastructure/dynamodb/AppointmentRepository";
import { publishAppointment } from "../infrastructure/sns/NotificationPublisher";
import { Appointment, AppointmentStatus } from "../domain/models/appointment";

export const postAppointment: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: "Missing body" };
    }
    const body = JSON.parse(event.body);
    if (!body.insuredId || !body.scheduleId || !body.countryISO) {
      return { statusCode: 400, body: "Missing required fields" };
    }
    if (!["PE", "CL"].includes(body.countryISO)) {
      return { statusCode: 400, body: "countryISO must be PE or CL" };
    }

    const appointment = createAppointment(body);

    await saveAppointment(appointment);

    await publishAppointment(appointment);

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: "Appointment scheduled. Processing...",
        appointmentId: appointment.id,
      }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};

export const getAppointmentsByInsuredIdHandler: APIGatewayProxyHandler = async (
  event
) => {
  try {
    const insuredId = event.pathParameters?.insuredId;
    if (!insuredId) {
      return { statusCode: 400, body: "Missing insuredId param" };
    }

    const appointments = await getAppointmentsByInsuredId(insuredId);

    return {
      statusCode: 200,
      body: JSON.stringify(appointments),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};

export const processCompletionFromSQS: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const appointment: Appointment = JSON.parse(record.body);
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

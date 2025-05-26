import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { createAppointment } from "../application/scheduleAppointment";
import {
  saveAppointment,
  getAppointmentsByInsuredId,
} from "../infrastructure/dynamodb/AppointmentRepository";
import { publishAppointment } from "../infrastructure/sns/NotificationPublisher";
import { hasRequiredFields, isValidCountryISO } from "../utils/validation";
import { createResponse } from "../utils/response";
import { MESSAGES } from "../utils/constants";

export const appointmentHandler: APIGatewayProxyHandler = async (event) => {
  try {
    switch (event.httpMethod) {
      case "POST":
        return await handlePostAppointment(event);
      case "GET":
        return await handleGetAppointments(event);
      default:
        return createResponse(405, MESSAGES.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

const handlePostAppointment = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, MESSAGES.MISSING_BODY);
    }
    const body = JSON.parse(event.body);
    if (!hasRequiredFields(body)) {
      return createResponse(400, MESSAGES.MISSING_REQUIRED_FIELDS);
    }
    if (!isValidCountryISO(body.countryISO)) {
      return createResponse(422, MESSAGES.INVALID_COUNTRY_ISO);
    }

    const appointment = createAppointment(body);

    await saveAppointment(appointment);

    await publishAppointment(appointment);

    return createResponse(202, {
      message: MESSAGES.APPOINTMENT_SCHEDULED,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error(error);
    return createResponse(500, MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

const handleGetAppointments = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const insuredId = event.queryStringParameters?.insuredId;

  if (!insuredId) {
    return { statusCode: 400, body: "Missing id query parameter" };
  }

  const appointments = await getAppointmentsByInsuredId(insuredId);

  return createResponse(200, appointments);
};

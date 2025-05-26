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
import { ERROR, MESSAGES } from "../utils/constants";

/**
 * Lambda handler for managing appointment-related HTTP requests.
 * Supports POST (create appointment) and GET (list appointments).
 *
 * @param event - API Gateway event object
 * @returns Response with appropriate status and body
 */
export const appointmentHandler: APIGatewayProxyHandler = async (event) => {
  try {
    switch (event.httpMethod) {
      case "POST":
        return await handlePostAppointment(event);
      case "GET":
        return await handleGetAppointments(event);
      default:
        return createResponse(405, {
          error: ERROR.METHOD_NOT_ALLOWED,
          details: MESSAGES.METHOD_NOT_ALLOWED,
        });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, {
      error: ERROR.INTERNAL_SERVER_ERROR,
      details: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Handles POST /appointments.
 * Validates the request body and schedules a new appointment.
 *
 * @param event - API Gateway event containing the appointment data in the body
 * @returns 202 on success, 400/422 on validation errors, 500 on server error
 */
const handlePostAppointment = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, {
        error: ERROR.MISSING_BODY,
        details: MESSAGES.MISSING_BODY,
      });
    }
    const body = JSON.parse(event.body);
    if (!hasRequiredFields(body)) {
      return createResponse(400, {
        error: ERROR.MISSING_REQUIRED_FIELDS,
        details: MESSAGES.MISSING_REQUIRED_FIELDS,
      });
    }
    if (!isValidCountryISO(body.countryISO)) {
      return createResponse(422, {
        error: ERROR.INVALID_COUNTRY_ISO,
        details: MESSAGES.INVALID_COUNTRY_ISO,
      });
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
    return createResponse(500, {
      error: ERROR.INTERNAL_SERVER_ERROR,
      details: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Handles GET /appointments/get.
 * Returns the list of appointments for the specified insuredId.
 *
 * @param event - API Gateway event with queryStringParameters containing insuredId
 * @returns 200 with appointments, 400 if insuredId missing, or 500 on server error
 */
const handleGetAppointments = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const insuredId = event.queryStringParameters?.insuredId;

  if (!insuredId) {
    return createResponse(400, {
      error: MESSAGES.MISSING_REQUIRED_FIELDS,
      details: "Missing insuredId param",
    });
  }

  const appointments = await getAppointmentsByInsuredId(insuredId);

  return createResponse(200, appointments);
};

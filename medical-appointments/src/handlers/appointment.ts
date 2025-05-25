import { APIGatewayProxyHandler } from 'aws-lambda';
import { createAppointment } from '../application/scheduleAppointment';
import { saveAppointment, getAppointmentsByInsuredId } from '../infrastructure/dynamodb/AppointmentRepository';
import { publishAppointment } from '../infrastructure/sns/NotificationPublisher';

export const postAppointment: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: 'Missing body' };
    }
    const body = JSON.parse(event.body);
    if (!body.insuredId || !body.scheduleId || !body.countryISO) {
      return { statusCode: 400, body: 'Missing required fields' };
    }
    if (!['PE', 'CL'].includes(body.countryISO)) {
      return { statusCode: 400, body: 'countryISO must be PE or CL' };
    }

    const appointment = createAppointment(body);

    await saveAppointment(appointment);

    await publishAppointment(appointment);

    return {
      statusCode: 202,
      body: JSON.stringify({ message: 'Appointment scheduled. Processing...', appointmentId: appointment.id }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

export const getAppointmentsByInsuredIdHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const insuredId = event.pathParameters?.insuredId;
    if (!insuredId) {
      return { statusCode: 400, body: 'Missing insuredId param' };
    }

    const appointments = await getAppointmentsByInsuredId(insuredId);

    return {
      statusCode: 200,
      body: JSON.stringify(appointments),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

import { DynamoDB } from 'aws-sdk';
import { Appointment, AppointmentStatus } from '../../domain/models/appointment';

const dynamo = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

export async function saveAppointment(appointment: Appointment): Promise<void> {
  const item = {
    ...appointment,
  };

  await dynamo.put({
    TableName: TABLE_NAME,
    Item: item,
  }).promise();
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  await dynamo.update({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    },
  }).promise();
}

export async function getAppointmentsByInsuredId(insuredId: string): Promise<Appointment[]> {
  const result = await dynamo.query({
    TableName: TABLE_NAME,
    IndexName: 'insuredId-index',
    KeyConditionExpression: 'insuredId = :insuredId',
    ExpressionAttributeValues: {
      ':insuredId': insuredId,
    },
  }).promise();

  return result.Items as Appointment[];
}

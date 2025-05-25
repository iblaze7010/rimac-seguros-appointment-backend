import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  Appointment,
  AppointmentStatus,
} from "../../domain/models/appointment";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export async function saveAppointment(appointment: Appointment): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: appointment,
    })
  );
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "set #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

export async function getAppointmentsByInsuredId(
  insuredId: string
): Promise<Appointment[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "insuredId-index",
      KeyConditionExpression: "insuredId = :insuredId",
      ExpressionAttributeValues: {
        ":insuredId": insuredId,
      },
    })
  );

  return (result.Items as Appointment[]) ?? [];
}

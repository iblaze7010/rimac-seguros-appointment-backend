// tests/infrastructure/dynamodb/AppointmentRepository.spec.ts

const mockSend = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actualLib = jest.requireActual("@aws-sdk/lib-dynamodb");
  return {
    ...actualLib,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend,
      })),
    },
    PutCommand: actualLib.PutCommand,
    UpdateCommand: actualLib.UpdateCommand,
    QueryCommand: actualLib.QueryCommand,
  };
});

import {
  saveAppointment,
  updateAppointmentStatus,
  getAppointmentsByInsuredId,
} from "../../../src/infrastructure/dynamodb/AppointmentRepository";

import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

describe("AppointmentRepositoryDynamoDB", () => {
  const TABLE = process.env.DYNAMODB_TABLE_NAME!;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveAppointment", () => {
    it("should save appointment successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      const appointment: Appointment = {
        id: "1",
        insuredId: "123",
        scheduleId: 1,
        countryISO: "PE",
        status: AppointmentStatus.Pending,
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(appointment);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: TABLE,
            Item: appointment,
          },
        })
      );
    });

    it("should throw error if put fails", async () => {
      const error = new Error("DynamoDB put error");
      mockSend.mockRejectedValueOnce(error);

      const appointment: Appointment = {
        id: "1",
        insuredId: "123",
        scheduleId: 1,
        countryISO: "PE",
        status: AppointmentStatus.Pending,
        createdAt: new Date().toISOString(),
      };

      await expect(saveAppointment(appointment)).rejects.toThrow(
        "DynamoDB put error"
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should update appointment status successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      const id = "1";
      const status = AppointmentStatus.Completed;

      await updateAppointmentStatus(id, status);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: TABLE,
            Key: { id },
            UpdateExpression: "set #status = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":status": status,
              ":updatedAt": expect.any(String),
            },
          },
        })
      );
    });

    it("should throw error if update fails", async () => {
      const error = new Error("DynamoDB update error");
      mockSend.mockRejectedValueOnce(error);

      await expect(
        updateAppointmentStatus("1", AppointmentStatus.Completed)
      ).rejects.toThrow("DynamoDB update error");

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAppointmentsByInsuredId", () => {
    it("should return appointments array", async () => {
      const items: Appointment[] = [
        {
          id: "1",
          insuredId: "123",
          scheduleId: 1,
          countryISO: "PE",
          status: AppointmentStatus.Pending,
          createdAt: new Date().toISOString(),
        },
      ];
      mockSend.mockResolvedValueOnce({ Items: items });

      const result = await getAppointmentsByInsuredId("123");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: TABLE,
            IndexName: "insuredId-index",
            KeyConditionExpression: "insuredId = :insuredId",
            ExpressionAttributeValues: { ":insuredId": "123" },
          },
        })
      );

      expect(result).toEqual(items);
    });

    it("should return empty array if no items found", async () => {
      mockSend.mockResolvedValueOnce({ Items: undefined });

      const result = await getAppointmentsByInsuredId("non-existent-id");

      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should throw error if query fails", async () => {
      const error = new Error("DynamoDB query error");
      mockSend.mockRejectedValueOnce(error);

      await expect(getAppointmentsByInsuredId("123")).rejects.toThrow(
        "DynamoDB query error"
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});

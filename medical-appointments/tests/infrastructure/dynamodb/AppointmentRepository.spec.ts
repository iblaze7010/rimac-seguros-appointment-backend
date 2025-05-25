// tests\infrastructure\dynamodb\AppointmentRepository.spec.ts

import AWS from "aws-sdk";
import {
  saveAppointment,
  updateAppointmentStatus,
  getAppointmentsByInsuredId,
} from "../../../src/infrastructure/dynamodb/AppointmentRepository";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

const {
  mockPut,
  mockPutPromise,
  mockUpdate,
  mockUpdatePromise,
  mockQuery,
  mockQueryPromise,
} = (AWS as any).__mocks;

describe("AppointmentRepositoryDynamoDB", () => {
  const TABLE = process.env.DYNAMODB_TABLE_NAME!;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveAppointment", () => {
    it("should save appointment successfully", async () => {
      mockPutPromise.mockResolvedValueOnce({});

      const appointment: Appointment = {
        id: "1",
        insuredId: "123",
        scheduleId: 1,
        countryISO: "PE",
        status: AppointmentStatus.Pending,
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(appointment);

      expect(mockPut).toHaveBeenCalledWith({
        TableName: TABLE,
        Item: appointment,
      });
      expect(mockPutPromise).toHaveBeenCalledTimes(1);
    });

    it("should throw error if put fails", async () => {
      const error = new Error("DynamoDB put error");
      mockPutPromise.mockRejectedValueOnce(error);

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
      expect(mockPut).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should update appointment status successfully", async () => {
      mockUpdatePromise.mockResolvedValueOnce({});

      const id = "1";
      const status = AppointmentStatus.Completed;

      await updateAppointmentStatus(id, status);

      expect(mockUpdate).toHaveBeenCalledWith({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: "set #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": expect.any(String),
        },
      });
      expect(mockUpdatePromise).toHaveBeenCalledTimes(1);
    });

    it("should throw error if update fails", async () => {
      const error = new Error("DynamoDB update error");
      mockUpdatePromise.mockRejectedValueOnce(error);

      await expect(
        updateAppointmentStatus("1", AppointmentStatus.Completed)
      ).rejects.toThrow("DynamoDB update error");
      expect(mockUpdate).toHaveBeenCalledTimes(1);
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
      mockQueryPromise.mockResolvedValueOnce({ Items: items });

      const result = await getAppointmentsByInsuredId("123");

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: TABLE,
        IndexName: "insuredId-index",
        KeyConditionExpression: "insuredId = :insuredId",
        ExpressionAttributeValues: { ":insuredId": "123" },
      });
      expect(mockQueryPromise).toHaveBeenCalledTimes(1);
      expect(result).toEqual(items);
    });

    it("should return empty array if no items found", async () => {
      mockQueryPromise.mockResolvedValueOnce({ Items: undefined });

      const result = await getAppointmentsByInsuredId("non-existent-id");

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQueryPromise).toHaveBeenCalledTimes(1);
    });

    it("should throw error if query fails", async () => {
      const error = new Error("DynamoDB query error");
      mockQueryPromise.mockRejectedValueOnce(error);

      await expect(getAppointmentsByInsuredId("123")).rejects.toThrow(
        "DynamoDB query error"
      );
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});

// Mock aws-sdk implementation
jest.mock("aws-sdk", () => {
  const mockPutPromise = jest.fn();
  const mockUpdatePromise = jest.fn();
  const mockQueryPromise = jest.fn();

  const mockPut = jest.fn(() => ({ promise: mockPutPromise }));
  const mockUpdate = jest.fn(() => ({ promise: mockUpdatePromise }));
  const mockQuery = jest.fn(() => ({ promise: mockQueryPromise }));

  class DocumentClient {
    put = mockPut;
    update = mockUpdate;
    query = mockQuery;
  }

  return {
    DynamoDB: { DocumentClient },
    __mocks: {
      mockPut,
      mockPutPromise,
      mockUpdate,
      mockUpdatePromise,
      mockQuery,
      mockQueryPromise,
    },
  };
});

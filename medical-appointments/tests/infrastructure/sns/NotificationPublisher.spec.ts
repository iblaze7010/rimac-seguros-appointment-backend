// tests/infrastructure/sns/NotificationPublisher.spec.ts

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-sns", () => {
  return {
    SNSClient: jest.fn(() => ({
      send: mockSend,
    })),
    PublishCommand: jest.requireActual("@aws-sdk/client-sns").PublishCommand,
  };
});

import { publishAppointment } from "../../../src/infrastructure/sns/NotificationPublisher";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

describe("publishAppointment", () => {
  const appointment: Appointment = {
    id: "appt123",
    insuredId: "user456",
    scheduleId: 789,
    countryISO: "PE",
    status: AppointmentStatus.Pending,
    createdAt: "2025-05-25T00:00:00.000Z",
  };

  beforeAll(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:MyTopic";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should publish appointment to SNS with correct parameters", async () => {
    mockSend.mockResolvedValueOnce({}); // simula respuesta exitosa

    await publishAppointment(appointment);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          TopicArn: process.env.SNS_TOPIC_ARN,
          Message: JSON.stringify(appointment),
          MessageAttributes: {
            countryISO: {
              DataType: "String",
              StringValue: "PE",
            },
          },
        },
      })
    );
  });

  it("should throw error if SNS publish fails", async () => {
    mockSend.mockRejectedValueOnce(new Error("SNS publish failed"));

    await expect(publishAppointment(appointment)).rejects.toThrow(
      "SNS publish failed"
    );
  });
});

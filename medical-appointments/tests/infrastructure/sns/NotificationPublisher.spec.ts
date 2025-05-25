// tests\infrastructure\sns\NotificationPublisher.spec.ts
import { SNS } from "aws-sdk";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

const mockPublishFn = jest.fn();
const mockPromiseFn = jest.fn();

jest.mock("aws-sdk", () => {
  return {
    SNS: jest.fn().mockImplementation(() => ({
      publish: mockPublishFn,
    })),
  };
});

import { publishAppointment } from "../../../src/infrastructure/sns/NotificationPublisher";

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
    mockPublishFn.mockReturnValue({
      promise: mockPromiseFn.mockResolvedValue({}),
    });
  });

  it("should publish appointment to SNS with correct parameters", async () => {
    await publishAppointment(appointment);

    expect(mockPublishFn).toHaveBeenCalledWith({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(appointment),
      MessageAttributes: {
        countryISO: {
          DataType: "String",
          StringValue: "PE",
        },
      },
    });

    expect(mockPromiseFn).toHaveBeenCalled();
  });

  it("should throw error if SNS publish fails", async () => {
    mockPublishFn.mockReturnValueOnce({
      promise: jest.fn().mockRejectedValueOnce(new Error("SNS publish failed")),
    });

    await expect(publishAppointment(appointment)).rejects.toThrow(
      "SNS publish failed"
    );
  });
});

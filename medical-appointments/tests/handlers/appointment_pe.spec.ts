import { handler } from "../../src/handlers/appointment_pe";
import * as rdsRepo from "../../src/infrastructure/rds/AppointmentRepositoryRDS";
import * as eventPublisher from "../../src/infrastructure/eventbridge/EventPublisher";
import { SQSEvent } from "aws-lambda";

jest.mock("../../src/infrastructure/rds/AppointmentRepositoryRDS");
jest.mock("../../src/infrastructure/eventbridge/EventPublisher");

describe("SQS Appointment_PE Handler", () => {
  const appointmentMock = {
    id: "123",
    insuredId: "0001",
    scheduleId: 456,
    countryISO: "PE",
    createdAt: new Date().toISOString(),
  };

  const mockEvent: SQSEvent = {
    Records: [
      {
        messageId: "1",
        receiptHandle: "",
        body: JSON.stringify({ Message: JSON.stringify(appointmentMock) }),
        attributes: {} as any,
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "",
        awsRegion: "",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save appointment and publish event", async () => {
    (rdsRepo.saveAppointmentRDS as jest.Mock).mockResolvedValue(undefined);
    (eventPublisher.publishAppointmentCompleted as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent, {} as any, () => {});

    expect(rdsRepo.saveAppointmentRDS).toHaveBeenCalledWith(appointmentMock);
    expect(rdsRepo.saveAppointmentRDS).toHaveBeenCalledTimes(1);

    expect(eventPublisher.publishAppointmentCompleted).toHaveBeenCalledWith(
      appointmentMock
    );
    expect(eventPublisher.publishAppointmentCompleted).toHaveBeenCalledTimes(1);
  });

  it("should throw error if saveAppointmentRDS fails", async () => {
    (rdsRepo.saveAppointmentRDS as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    await expect(handler(mockEvent, {} as any, () => {})).rejects.toThrow(
      "DB error"
    );
    expect(rdsRepo.saveAppointmentRDS).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publishAppointmentCompleted).toHaveBeenCalledTimes(0);
  });

  it("should throw error if publishAppointmentCompleted fails", async () => {
    (rdsRepo.saveAppointmentRDS as jest.Mock).mockResolvedValue(undefined);
    (eventPublisher.publishAppointmentCompleted as jest.Mock).mockRejectedValue(
      new Error("Event error")
    );

    await expect(handler(mockEvent, {} as any, () => {})).rejects.toThrow(
      "Event error"
    );
    expect(rdsRepo.saveAppointmentRDS).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publishAppointmentCompleted).toHaveBeenCalledTimes(1);
  });
});

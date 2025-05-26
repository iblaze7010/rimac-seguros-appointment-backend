const mockSend = jest.fn();

jest.mock("@aws-sdk/client-eventbridge", () => {
  return {
    EventBridgeClient: jest.fn(() => ({
      send: mockSend,
    })),
    PutEventsCommand: jest.requireActual("@aws-sdk/client-eventbridge")
      .PutEventsCommand,
  };
});

import { publishAppointmentCompleted } from "../../../src/infrastructure/eventbridge/EventPublisher";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

describe("publishAppointmentCompleted", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call send with correct PutEventsCommand and parameters", async () => {
    mockSend.mockResolvedValue({ FailedEntryCount: 0 });

    const appointment: Appointment = {
      id: "abc123",
      insuredId: "insured1",
      scheduleId: 1,
      countryISO: "PE",
      status: AppointmentStatus.Pending,
      createdAt: new Date().toISOString(),
    };

    process.env.EVENT_BUS_NAME = "test-bus";

    await publishAppointmentCompleted(appointment);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Entries: [
            {
              EventBusName: "test-bus",
              Source: "appointment.app",
              DetailType: "AppointmentCompleted",
              Detail: JSON.stringify(appointment),
            },
          ],
        },
      })
    );
  });

  it("should throw error when send fails", async () => {
    const error = new Error("EventBridge error");
    mockSend.mockRejectedValue(error);

    const appointment: Appointment = {
      id: "abc123",
      insuredId: "insured1",
      scheduleId: 1,
      countryISO: "PE",
      status: AppointmentStatus.Pending,
      createdAt: new Date().toISOString(),
    };

    process.env.EVENT_BUS_NAME = "test-bus";

    await expect(publishAppointmentCompleted(appointment)).rejects.toThrow(
      "EventBridge error"
    );

    expect(mockSend).toHaveBeenCalled();
  });
});

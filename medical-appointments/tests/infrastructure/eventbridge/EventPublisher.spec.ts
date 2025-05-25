// tests/infrastructure/eventbridge/EventPublisher.spec.ts

var mockPutEvents = jest.fn().mockReturnThis();
var mockPromise = jest.fn();

jest.mock("aws-sdk", () => ({
  EventBridge: jest.fn().mockImplementation(() => ({
    putEvents: mockPutEvents,
    promise: mockPromise,
  })),
}));

import { publishAppointmentCompleted } from "../../../src/infrastructure/eventbridge/EventPublisher";
import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

describe("publishAppointmentCompleted", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call putEvents with correct parameters", async () => {
    mockPromise.mockResolvedValue({ FailedEntryCount: 0 });

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

    expect(mockPutEvents).toHaveBeenCalledWith({
      Entries: [
        {
          EventBusName: "test-bus",
          Source: "appointment.app",
          DetailType: "AppointmentCompleted",
          Detail: JSON.stringify(appointment),
        },
      ],
    });

    expect(mockPromise).toHaveBeenCalled();
  });

  it("should throw error when putEvents fails", async () => {
    const error = new Error("EventBridge error");
    mockPromise.mockRejectedValue(error);

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

    expect(mockPutEvents).toHaveBeenCalled();
    expect(mockPromise).toHaveBeenCalled();
  });
});

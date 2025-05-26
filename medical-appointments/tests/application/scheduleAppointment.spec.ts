import { createAppointment } from "../../src/application/scheduleAppointment";
import { AppointmentStatus } from "../../src/domain/models/appointment";
import { v4 as uuidv4 } from "uuid";

jest.mock("uuid");

describe("createAppointment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create appointment with correct properties", () => {
    (uuidv4 as jest.Mock).mockReturnValue("mocked-uuid");

    const input = {
      insuredId: "00001",
      scheduleId: 123,
      countryISO: "PE" as const,
    };

    const appointment = createAppointment(input);

    expect(appointment).toEqual({
      id: "mocked-uuid",
      insuredId: "00001",
      scheduleId: 123,
      countryISO: "PE",
      status: AppointmentStatus.Pending,
      createdAt: expect.any(String),
    });

    expect(new Date(appointment.createdAt).toISOString()).toBe(
      appointment.createdAt
    );
  });
});

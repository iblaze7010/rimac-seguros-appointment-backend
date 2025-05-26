import { processCompletionFromSQS } from "../../src/handlers/appointment_confirmation";
import { updateAppointmentStatus } from "../../src/infrastructure/dynamodb/AppointmentRepository";
import { AppointmentStatus } from "../../src/domain/models/appointment";

jest.mock("../../src/infrastructure/dynamodb/AppointmentRepository", () => ({
  updateAppointmentStatus: jest.fn(),
}));

describe("processCompletionFromSQS", () => {
  it("should update appointment status to Completed", async () => {
    const fakeAppointmentId = "12345";
    const mockEvent = {
      Records: [
        {
          body: JSON.stringify({
            detail: {
              id: fakeAppointmentId,
              scheduleId: "12121",
              insuredId: "212",
              countryISO: "PE",
            },
          }),
        },
      ],
    };

    await processCompletionFromSQS(mockEvent as any, {} as any, () => {});

    expect(updateAppointmentStatus).toHaveBeenCalledWith(
      fakeAppointmentId,
      AppointmentStatus.Completed
    );
  });

  it("should throw and log error if update fails", async () => {
    const errorMsg = "DB error";
    (updateAppointmentStatus as jest.Mock).mockRejectedValueOnce(
      new Error(errorMsg)
    );

    const fakeAppointmentId = "fail-id";
    const mockEvent = {
      Records: [
        {
          body: JSON.stringify({
            detail: { id: fakeAppointmentId },
          }),
        },
      ],
    };

    await expect(
      processCompletionFromSQS(mockEvent as any, {} as any, () => {})
    ).rejects.toThrow(errorMsg);
  });
});

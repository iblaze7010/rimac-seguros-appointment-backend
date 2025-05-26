import {
  Appointment,
  AppointmentStatus,
} from "../../../src/domain/models/appointment";

const mockGetConnPE = { execute: jest.fn(), release: jest.fn() };
const mockGetConnCL = { execute: jest.fn(), release: jest.fn() };
const fakePoolPE = {
  getConnection: jest.fn().mockResolvedValue(mockGetConnPE),
};
const fakePoolCL = {
  getConnection: jest.fn().mockResolvedValue(mockGetConnCL),
};

const mockCreatePool = jest
  .fn()
  .mockReturnValueOnce(fakePoolPE)
  .mockReturnValueOnce(fakePoolCL);

jest.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: mockCreatePool },
}));

import { saveAppointmentRDS } from "../../../src/infrastructure/rds/AppointmentRepositoryRDS";

describe("saveAppointmentRDS", () => {
  const baseAppointment: Omit<Appointment, "countryISO"> = {
    id: "appt1",
    insuredId: "user1",
    scheduleId: 100,
    status: AppointmentStatus.Pending,
    createdAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    mockGetConnPE.execute.mockClear();
    mockGetConnPE.release.mockClear();
    mockGetConnCL.execute.mockClear();
    mockGetConnCL.release.mockClear();
    fakePoolPE.getConnection.mockClear();
    fakePoolCL.getConnection.mockClear();
  });

  it("should insert into PE pool and release connection", async () => {
    const appt: Appointment = { ...baseAppointment, countryISO: "PE" };

    await saveAppointmentRDS(appt);

    expect(mockCreatePool).toHaveBeenCalledTimes(2);

    expect(fakePoolPE.getConnection).toHaveBeenCalledTimes(1);
    expect(mockGetConnPE.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO appointments"),
      [
        appt.id,
        appt.insuredId,
        appt.scheduleId,
        appt.countryISO,
        appt.status,
        appt.createdAt,
      ]
    );
    expect(mockGetConnPE.release).toHaveBeenCalledTimes(1);
  });

  it("should insert into CL pool and release connection", async () => {
    const appt: Appointment = { ...baseAppointment, countryISO: "CL" };

    await saveAppointmentRDS(appt);

    expect(fakePoolCL.getConnection).toHaveBeenCalledTimes(1);
    expect(mockGetConnCL.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO appointments"),
      [
        appt.id,
        appt.insuredId,
        appt.scheduleId,
        appt.countryISO,
        appt.status,
        appt.createdAt,
      ]
    );
    expect(mockGetConnCL.release).toHaveBeenCalledTimes(1);
  });

  it("should throw if countryISO does not map to a pool", async () => {
    const appt = { ...baseAppointment, countryISO: "XX" as any };
    await expect(saveAppointmentRDS(appt)).rejects.toThrow(
      "No pool defined for country: XX"
    );
  });

  it("should release connection even if execute throws", async () => {
    const appt: Appointment = { ...baseAppointment, countryISO: "PE" };
    const err = new Error("DB error");
    mockGetConnPE.execute.mockRejectedValueOnce(err);

    await expect(saveAppointmentRDS(appt)).rejects.toThrow("DB error");
    expect(mockGetConnPE.release).toHaveBeenCalledTimes(1);
  });
});

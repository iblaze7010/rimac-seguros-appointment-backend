import { Appointment, AppointmentStatus } from "../domain/models/appointment";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a new Appointment object with default status and timestamp.
 *
 * @param input - Appointment input data including insuredId, scheduleId, and countryISO
 * @returns A fully initialized Appointment object
 */
export function createAppointment(input: {
  insuredId: string;
  scheduleId: number;
  countryISO: "PE" | "CL";
}): Appointment {
  return {
    id: uuidv4(),
    insuredId: input.insuredId,
    scheduleId: input.scheduleId,
    countryISO: input.countryISO,
    status: AppointmentStatus.Pending,
    createdAt: new Date().toISOString(),
  };
}

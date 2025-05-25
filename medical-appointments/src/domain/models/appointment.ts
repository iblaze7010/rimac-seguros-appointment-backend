export enum AppointmentStatus {
  Pending = 'pending',
  Completed = 'completed',
}

export interface Appointment {
  id: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

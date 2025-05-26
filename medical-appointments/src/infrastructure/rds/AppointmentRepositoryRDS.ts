import { Appointment } from "../../domain/models/appointment";
import mysql, { Pool } from "mysql2/promise";

/**
 * MySQL connection pools keyed by country ISO code.
 * Separate pools for PE and CL databases.
 */
const pools: Record<string, Pool> = {
  PE: mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE_PE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }),
  CL: mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE_CL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }),
};

/**
 * Saves an appointment to the appropriate RDS database based on countryISO.
 *
 * @param appointment - Appointment object to be saved.
 * @throws Error if no pool is defined for the given countryISO.
 */
export async function saveAppointmentRDS(
  appointment: Appointment
): Promise<void> {
  const pool = pools[appointment.countryISO];

  if (!pool) {
    throw new Error(`No pool defined for country: ${appointment.countryISO}`);
  }

  const sql = `INSERT INTO appointments (id, insuredId, scheduleId, countryISO, status, createdAt)
               VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [
    appointment.id,
    appointment.insuredId,
    appointment.scheduleId,
    appointment.countryISO,
    appointment.status,
    appointment.createdAt,
  ];

  const conn = await pool.getConnection();
  try {
    await conn.execute(sql, values);
  } finally {
    conn.release();
  }
}

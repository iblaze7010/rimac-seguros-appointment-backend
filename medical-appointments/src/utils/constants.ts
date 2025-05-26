/**
 * Standard error codes used in API responses.
 */
export const ERROR = {
  METHOD_NOT_ALLOWED: "Method Not Allowed",
  MISSING_BODY: "Missing body",
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  INVALID_COUNTRY_ISO: "Error countryISO",
  MISSING_QUERY_PARAM: "Missing id query parameter",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  APPOINTMENT_SCHEDULED: "Appointment scheduled. Processing...",
};

/**
 * Messages used in API responses.
 */
export const MESSAGES = {
  METHOD_NOT_ALLOWED: "Only GET and POST methods are supported",
  MISSING_BODY: "The request body is required",
  MISSING_REQUIRED_FIELDS:
    "The fields insuredId, scheduleId and countryISO are required",
  INVALID_COUNTRY_ISO: "countryISO must be PE or CL",
  MISSING_QUERY_PARAM: "Missing id query parameter",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  APPOINTMENT_SCHEDULED: "Appointment scheduled. Processing...",
};

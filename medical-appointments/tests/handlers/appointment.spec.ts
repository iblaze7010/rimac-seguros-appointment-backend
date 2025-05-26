import { APIGatewayProxyEvent } from "aws-lambda";
import { appointmentHandler } from "../../src/handlers/appointment";

import * as repo from "../../src/infrastructure/dynamodb/AppointmentRepository";
import * as sns from "../../src/infrastructure/sns/NotificationPublisher";

jest.mock("../../src/infrastructure/dynamodb/AppointmentRepository");
jest.mock("../../src/infrastructure/sns/NotificationPublisher");

describe("appointmentHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /appointments", () => {
    const baseEvent = {
      httpMethod: "POST",
    } as unknown as APIGatewayProxyEvent;

    it("returns 400 if no body", async () => {
      const event = { ...baseEvent, body: null };
      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing body");
    });

    it("returns 400 if missing required fields", async () => {
      const event = {
        ...baseEvent,
        body: JSON.stringify({ insuredId: "123" }),
      };
      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing required fields");
    });

    it("returns 422 if countryISO invalid", async () => {
      const event = {
        ...baseEvent,
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "US",
        }),
      };
      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(422);
      expect(res?.body).toBe("countryISO must be PE or CL");
    });

    it("returns 202 and calls saveAppointment and publishAppointment on success", async () => {
      const event = {
        ...baseEvent,
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "PE",
        }),
      };

      (repo.saveAppointment as jest.Mock).mockResolvedValue(undefined);
      (sns.publishAppointment as jest.Mock).mockResolvedValue(undefined);

      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(202);
      const body = JSON.parse(res?.body ?? "{}");
      expect(body.message).toBe("Appointment scheduled. Processing...");
      expect(body.appointmentId).toBeDefined();
      expect(repo.saveAppointment).toHaveBeenCalledTimes(1);
      expect(sns.publishAppointment).toHaveBeenCalledTimes(1);
    });

    it("returns 500 if saveAppointment throws", async () => {
      const event = {
        ...baseEvent,
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "PE",
        }),
      };

      (repo.saveAppointment as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(500);
      expect(res?.body).toBe("Internal Server Error");
    });
  });

  describe("GET /appointments", () => {
    const baseEvent = {
      httpMethod: "GET",
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    it("returns 400 if no insuredId", async () => {
      const res = await appointmentHandler(baseEvent, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing id query parameter");
    });

    it("returns 200 with appointments", async () => {
      const fakeAppointments = [{ id: "1" }, { id: "2" }];
      (repo.getAppointmentsByInsuredId as jest.Mock).mockResolvedValue(
        fakeAppointments
      );

      const event = {
        ...baseEvent,
        queryStringParameters: { insuredId: "123" },
      };

      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(200);
      expect(JSON.parse(res?.body ?? "{}")).toEqual(fakeAppointments);
      expect(repo.getAppointmentsByInsuredId).toHaveBeenCalledWith("123");
    });

    it("returns 500 if getAppointmentsByInsuredId throws", async () => {
      (repo.getAppointmentsByInsuredId as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const event = {
        ...baseEvent,
        queryStringParameters: { insuredId: "123" },
      };

      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(500);
      expect(res?.body).toBe("Internal Server Error");
    });
  });

  describe("Method Not Allowed", () => {
    it("returns 405 for unsupported method", async () => {
      const event = {
        httpMethod: "DELETE",
      } as unknown as APIGatewayProxyEvent;

      const res = await appointmentHandler(event, {} as any, () => {});
      expect(res?.statusCode).toBe(405);
      expect(res?.body).toBe("Method Not Allowed");
    });
  });
});

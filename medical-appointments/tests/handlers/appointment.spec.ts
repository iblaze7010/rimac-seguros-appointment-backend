// tests\handlers\appointment.spec.ts

import { APIGatewayProxyEvent } from "aws-lambda";
import {
  postAppointment,
  getAppointmentsByInsuredIdHandler,
  processCompletionFromSQS,
} from "../../src/handlers/appointment";

import * as repo from "../../src/infrastructure/dynamodb/AppointmentRepository";
import * as sns from "../../src/infrastructure/sns/NotificationPublisher";

jest.mock("../../src/infrastructure/dynamodb/AppointmentRepository");
jest.mock("../../src/infrastructure/sns/NotificationPublisher");

describe("Handlers tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("postAppointment", () => {
    it("returns 400 if no body", async () => {
      const event = { body: null } as unknown as APIGatewayProxyEvent;
      const res = await postAppointment(event, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing body");
    });

    it("returns 400 if missing required fields", async () => {
      const event = {
        body: JSON.stringify({ insuredId: "123" }),
      } as APIGatewayProxyEvent;
      const res = await postAppointment(event, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing required fields");
    });

    it("returns 400 if countryISO invalid", async () => {
      const event = {
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "US",
        }),
      } as APIGatewayProxyEvent;
      const res = await postAppointment(event, {} as any, () => {});
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("countryISO must be PE or CL");
    });

    it("returns 202 and calls saveAppointment and publishAppointment on success", async () => {
      const event = {
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "PE",
        }),
      } as APIGatewayProxyEvent;

      (repo.saveAppointment as jest.Mock).mockResolvedValue(undefined);
      (sns.publishAppointment as jest.Mock).mockResolvedValue(undefined);

      const res = await postAppointment(event, {} as any, () => {});

      expect(res?.statusCode).toBe(202);
      const body = JSON.parse(res?.body ?? "{}");
      expect(body.message).toBe("Appointment scheduled. Processing...");
      expect(body.appointmentId).toBeDefined();

      expect(repo.saveAppointment).toHaveBeenCalledTimes(1);
      expect(sns.publishAppointment).toHaveBeenCalledTimes(1);
    });

    it("returns 500 if saveAppointment throws", async () => {
      const event = {
        body: JSON.stringify({
          insuredId: "123",
          scheduleId: 1,
          countryISO: "PE",
        }),
      } as APIGatewayProxyEvent;

      (repo.saveAppointment as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const res = await postAppointment(event, {} as any, () => {});

      expect(res?.statusCode).toBe(500);
      expect(res?.body).toBe("Internal Server Error");
    });
  });

  describe("getAppointmentsByInsuredIdHandler", () => {
    it("returns 400 if no insuredId param", async () => {
      const event = {
        pathParameters: {},
      } as unknown as APIGatewayProxyEvent;

      const res = await getAppointmentsByInsuredIdHandler(
        event,
        {} as any,
        () => {}
      );
      expect(res?.statusCode).toBe(400);
      expect(res?.body).toBe("Missing insuredId param");
    });

    it("returns 200 with appointments list", async () => {
      const event = {
        pathParameters: { insuredId: "123" },
      } as unknown as APIGatewayProxyEvent;

      const fakeAppointments = [{ id: "abc" }, { id: "def" }];

      (repo.getAppointmentsByInsuredId as jest.Mock).mockResolvedValue(
        fakeAppointments
      );

      const res = await getAppointmentsByInsuredIdHandler(
        event,
        {} as any,
        () => {}
      );

      expect(res?.statusCode).toBe(200);
      expect(JSON.parse(res?.body ?? "{}")).toEqual(fakeAppointments);
      expect(repo.getAppointmentsByInsuredId).toHaveBeenCalledWith("123");
    });

    it("returns 500 if repo throws", async () => {
      const event = {
        pathParameters: { insuredId: "123" },
      } as unknown as APIGatewayProxyEvent;

      (repo.getAppointmentsByInsuredId as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const res = await getAppointmentsByInsuredIdHandler(
        event,
        {} as any,
        () => {}
      );

      expect(res?.statusCode).toBe(500);
      expect(res?.body).toBe("Internal Server Error");
    });
  });

  describe("processCompletionFromSQS", () => {
    it("updates appointment status for each record", async () => {
      const event = {
        Records: [
          { body: JSON.stringify({ id: "appt1" }) },
          { body: JSON.stringify({ id: "appt2" }) },
        ],
      } as any;

      (repo.updateAppointmentStatus as jest.Mock).mockResolvedValue(undefined);

      await processCompletionFromSQS(event, {} as any, () => {});

      expect(repo.updateAppointmentStatus).toHaveBeenCalledTimes(2);
      expect(repo.updateAppointmentStatus).toHaveBeenCalledWith(
        "appt1",
        expect.anything()
      );
      expect(repo.updateAppointmentStatus).toHaveBeenCalledWith(
        "appt2",
        expect.anything()
      );
    });

    it("throws if updateAppointmentStatus throws", async () => {
      const event = {
        Records: [{ body: JSON.stringify({ id: "appt1" }) }],
      } as any;

      (repo.updateAppointmentStatus as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      await expect(
        processCompletionFromSQS(event, {} as any, () => {})
      ).rejects.toThrow("DB error");
    });
  });
});

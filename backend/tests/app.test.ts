import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("HTTP app", () => {
  it("responds to the health check", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Route not found");
  });

  it("rejects unauthenticated access to conversations", async () => {
    const response = await request(app).get("/api/conversations");

    expect(response.status).toBe(401);
  });
});

import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";
import { act } from "react";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});
describe("GET api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      expect(response.status).toBe(200);
      // Testes da data
      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database).not.toHaveProperty("version");

      expect(responseBody.dependencies.database.max_conn).toBeDefined();
      expect(responseBody.dependencies.database.max_conn).not.toBeNull();

      expect(responseBody.dependencies.database.used_conn).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const activateUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activateUser.id);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database).not.toHaveProperty("version");

      expect(responseBody.dependencies.database.max_conn).toBeDefined();
      expect(responseBody.dependencies.database.max_conn).not.toBeNull();

      expect(responseBody.dependencies.database.used_conn).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const activateUser = await orchestrator.activateUser(createdUser.id);
      await orchestrator.addFeaturesToUser(activateUser.id, [
        "read:status:all",
      ]);
      const sessionObject = await orchestrator.createSession(activateUser.id);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database).toHaveProperty("version");
      expect(responseBody.dependencies.database.version).toBe("16.0");

      expect(responseBody.dependencies.database.max_conn).toBeDefined();
      expect(responseBody.dependencies.database.max_conn).not.toBeNull();

      expect(responseBody.dependencies.database.used_conn).toEqual(1);
    });
  });
});

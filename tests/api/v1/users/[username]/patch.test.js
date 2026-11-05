import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username utilizado já existe.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const userNew = await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const user2response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueuser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(user2response.status).toBe(200);

      const responseBody = await user2response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: userNew.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With my own and unique 'username'", async () => {
      const uniqueUsername = await orchestrator.createUser({
        username: "my-own-unique-username",
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/my-own-unique-username",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "My-Own-Unique-Username",
          }),
        },
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "My-Own-Unique-Username",
        email: uniqueUsername.email,
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      expect(response2Body.updated_at > response2Body.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const userEmail = await orchestrator.createUser({
        email: "uniqueEmail1@example.com",
      });

      const user2response = await fetch(
        `http://localhost:3000/api/v1/users/${userEmail.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueEmail2@example.com",
          }),
        },
      );

      expect(user2response.status).toBe(200);

      const responseBody = await user2response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userEmail.username,
        email: "uniqueEmail2@example.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@example.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@example.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email utilizado já existe.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With empty 'password'", async () => {
      const userPass = await orchestrator.createUser({});

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userPass.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "",
          }),
        },
      );

      expect(response.status).toBe(400);

      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "A senha é obrigatória.",
        action: "Informe uma senha válida para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With new 'password'", async () => {
      const passUser = await orchestrator.createUser({
        password: "password123",
      });

      const user2response = await fetch(
        `http://localhost:3000/api/v1/users/${passUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(user2response.status).toBe(200);

      const responseBody = await user2response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: passUser.username,
        email: passUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );

      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});

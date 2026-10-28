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
    test("With unique 'username'", async () => {
      const userNew = await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const user2response = await fetch(
        `http://localhost:3000/api/v1/users/${userNew.username}`,
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

      expect(user2response.status).toBe(403);

      const responseBody = await user2response.json();

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      const activadedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            cookie: `session_id=${sessionObject.token}`,
          },
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

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      const activadedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(
        activadedUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${sessionObject2.token}`,
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
      const createdUser = await orchestrator.createUser({
        username: "uniqueUser01",
      });
      const activadedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const user2response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUser02",
          }),
        },
      );

      expect(user2response.status).toBe(200);

      const responseBody = await user2response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser02",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
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
      const activadedUser = await orchestrator.activateUser(uniqueUsername.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/my-own-unique-username",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "My-Own-Unique-Username",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "My-Own-Unique-Username",
        email: uniqueUsername.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@example.com",
      });
      const activadedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@example.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: "uniqueEmail2@example.com",
        features: ["create:session", "read:session", "update:user"],
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
      const activadedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(
        activadedUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject2.token}`,
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
      const activadedUser = await orchestrator.activateUser(userPass.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userPass.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
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
      const activadedUser = await orchestrator.activateUser(passUser.id);
      const sessionObject = await orchestrator.createSession(activadedUser.id);

      const user2response = await fetch(
        `http://localhost:3000/api/v1/users/${passUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

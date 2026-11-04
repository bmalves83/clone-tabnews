import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";
import { password } from "pg/lib/defaults";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("Whitout `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("Whitout `user.features`", () => {
      const createdUser = { username: "userWithoutFeatures" };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Whitout unknown `feature`", () => {
      const createdUser = { features: [] };
      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("Whitout valid `user` and known `feature`", () => {
      const createdUser = { features: ["create:user"] };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("Whitout `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Whitout `user.features`", () => {
      const createdUser = { username: "userWithoutFeatures" };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Whitout unknown `feature`", () => {
      const createdUser = { features: [] };
      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("With valid `user`, known `feature` but no `resource`", () => {
      const createdUser = { features: [] };
      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("Whitout valid `user`, known `feature` and `resource`", () => {
      const createdUser = { features: ["read:user"] };

      const resource = {
        id: 1,
        username: "user1",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        email: "user1@example.com",
        password: "password",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );
      expect(result).toEqual({
        id: 1,
        username: "user1",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    });
  });
});

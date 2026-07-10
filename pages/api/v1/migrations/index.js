import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  const allowedMethods = ["POST", "GET"];
  if (!allowedMethods.includes(request.method)) {
    return response
      .status(405)
      .json({ error: `Method "${request.method}" not allowed` });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
    }

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner({
        ...defaultMigrationOptions,
      });
      return response.status(200).json(pendingMigrations);
    }
  } catch (error) {
    console.error("Erro na execução das migrações:", error);
    throw error;
  } finally {
    await dbClient.end(); // Garante que a conexão seja fechada mesmo em caso de erro
  }
}

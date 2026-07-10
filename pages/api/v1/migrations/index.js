import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({ message: "Method not allowed" });
  }

  const dbClient = await database.getNewClient();

  try {
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

      await dbClient.end(); // Fecha a conexão com o banco de dados após a execução da consulta

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
    }

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner({
        ...defaultMigrationOptions,
      });
      await dbClient.end(); // Fecha a conexão com o banco de dados após a execução da consulta
      return response.status(200).json(pendingMigrations);
    }
  } finally {
    await dbClient.end(); // Garante que a conexão seja fechada mesmo em caso de erro
  }
}

import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { ServiceError } from "infra/errors.js";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pendingMigrations;
  } catch (err) {
    const listPendingMigrationsError = new ServiceError({
      message: "Falha na listagem das migrações pendentes",
      cause: err,
      statusCode: 503,
    });
    throw listPendingMigrationsError;
  } finally {
    await dbClient?.end(); // Garante que a conexão seja fechada mesmo em caso de erro
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });
    return migratedMigrations;
  } catch (err) {
    const runPendingMigrationsError = new ServiceError({
      message: "Falha na execução das migrações pendentes",
      cause: err,
      statusCode: 503,
    });
    throw runPendingMigrationsError;
  } finally {
    await dbClient?.end(); // Garante que a conexão seja fechada mesmo em caso de erro
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;

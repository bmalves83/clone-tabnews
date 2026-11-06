import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonimousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const updatedAt = new Date().toISOString();

  const dbVersion = await database.query("SHOW server_version;");
  const dbResult = dbVersion.rows[0].server_version;

  const maxConn = await database.query("SHOW max_connections;");
  const maxResult = maxConn.rows[0].max_connections;

  const dbname = process.env.POSTGRES_DB;
  const usedConn = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [dbname],
  });
  const usedResult = usedConn.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbResult,
        max_conn: parseInt(maxResult),
        used_conn: usedResult,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureOutputValues);
}

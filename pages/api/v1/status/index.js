import database from "infra/database.js";

async function status(request, response) {
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

  const dependencies = {
    database: {
      version: dbResult,
      max_conn: parseInt(maxResult),
      used_conn: usedResult,
    },
  };

  response.status(200).json({
    updated_at: updatedAt,
    dependencies,
  });
}

export default status;

// infra/database.js (NÃO RECOMENDADO para uso geral em APIs)
import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
  console.log("Credencias DB: ", {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
  // let result; // Declare result fora do bloco try
  try {
    await client.connect();
    const result = await client.query(queryObject); // Atribua a result
    return result; // Agora result está acessível aqui
  } catch (err) {
    console.error("Erro na consulta:", err);
    throw err; // Re-lança o erro para que o chamador possa tratá-lo
  } finally {
    await client.end(); // Garante que a conexão seja fechada
  }
}

export default {
  query: query,
};

import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *    
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "BMALves83 <contato@bmalves83.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no BMAlves83",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no BMAlves83:

${webserver.origin}/cadastro/ativar/${activationToken.id}
 
Atenciosamente,
Equipe BMAlves83`,
  });
}

async function findOneValidById(tokenId) {
  const newToken = await runSelectQuery(tokenId);
  return newToken;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
      AND
        used_at IS NULL
      AND
        expires_at > NOW()
      LIMIT
        1  
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        name: "NotFoundError",
        message: "Não foi encontrado token válido.",
        action: "Refaça o cadastro e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
};

export default activation;

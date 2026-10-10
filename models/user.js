import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import password from "models/password.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
    SELECT 
      * 
    FROM 
      users 
    WHERE 
      LOWER(username) = LOWER($1)
    LIMIT
      1  
    ;`,
      values: [username],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    }

    return results.rows[0];
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
    SELECT 
      email 
    FROM 
      users 
    WHERE 
      LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email utilizado já existe.",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
    SELECT 
      username 
    FROM 
      users 
    WHERE 
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username utilizado já existe.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validatePassword(passwordValue) {
  if (typeof passwordValue !== "string" || passwordValue.trim().length === 0) {
    throw new ValidationError({
      message: "A senha é obrigatória.",
      action: "Informe uma senha válida para realizar esta operação.",
    });
  }
}

async function runUpdateQuery(userWithNewValues) {
  const results = await database.query({
    text: `
    UPDATE 
      users 
    SET 
      username = $1,
      email = $2,
      password = $3,
      updated_at = timezone('UTC', now())
    WHERE 
      id = $4
    RETURNING 
      *
    ;`,
    values: [
      userWithNewValues.username,
      userWithNewValues.email,
      userWithNewValues.password,
      userWithNewValues.id,
    ],
  });
  return results.rows[0];
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await validatePassword(userInputValues.password);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
    INSERT INTO 
      users 
        (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING 
        *
    ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return results.rows[0];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if (
    "username" in userInputValues &&
    username.toLowerCase() !== userInputValues.username.toLowerCase()
  ) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await validatePassword(userInputValues.password);
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;

import bcryptjs from "bcryptjs";
import { NotFoundError } from "infra/errors";
import { createHmac } from "node:crypto";

function getPepper() {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new NotFoundError({
      message: "PASSWORD_PEPPER is not defined",
      action: "Entre em contato com o suporte",
    });
  }
  return pepper;
}

function applyPepper(password) {
  const pepper = getPepper();
  return createHmac("sha256", pepper).update(password).digest("hex");
}

async function hash(password) {
  const rounds = getNumberOfRounds();
  const salt = await bcryptjs.genSalt(rounds);
  const pepperedPassword = applyPepper(password);
  const hashedPassword = await bcryptjs.hash(pepperedPassword, salt);
  return hashedPassword;
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(password, hashedPassword) {
  const pepperedPassword = applyPepper(password);
  return await bcryptjs.compare(pepperedPassword, hashedPassword);
}

const password = {
  hash,
  compare,
};

export default password;

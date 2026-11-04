import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonimousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryinToGet = request.context.user;
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneByUserId(sessionObject.user_id);

  const secureOutputValues = authorization.filterOutput(
    userTryinToGet,
    "read:user:self",
    userFound,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  return response.status(200).json(secureOutputValues);
}

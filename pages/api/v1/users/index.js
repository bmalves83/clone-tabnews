import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonimousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryinToPost = request.context.user;
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryinToPost,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}

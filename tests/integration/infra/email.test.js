import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("Email service", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();
    await email.send({
      from: "BMAlves <contato@bmalves83.com.br>",
      to: "<contato@teste.com.br>",
      subject: "Test email",
      text: "Teste de mensagem.",
    });

    await email.send({
      from: "BMAlves <contato@bmalves83.com.br>",
      to: "<contato@teste.com.br>",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@bmalves83.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@teste.com.br>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email.\r\n");
  });
});

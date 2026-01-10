function showStatus(request, response) {
  response.status(200).json({ chave: "Teste de resposta om acentos ção" });
}

export default showStatus;

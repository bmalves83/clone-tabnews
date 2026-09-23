import useSWR from "swr";
async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status Page</h1>
      <UpdatedAt />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";
  let dbMax = "";
  let usedConn = "";
  let versionDB = "";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    dbMax = `Conexões Máximas: ${data.dependencies.database.max_conn}`;
    usedConn = `Conexões Utilizadas: ${data.dependencies.database.used_conn}`;
    versionDB = `Versão do Banco de Dados: ${data.dependencies.database.version}`;
  }

  return (
    <>
      <p>Última atualização: {updatedAtText}</p>
      <p>{versionDB}</p>
      <p>{dbMax}</p>
      <p>{usedConn}</p>
    </>
  );
}

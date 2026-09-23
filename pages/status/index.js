import useSWR from "swr";
async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DataBaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <>
      <p>Última atualização: {updatedAtText}</p>
    </>
  );
}

function DataBaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI);

  let database_info = "Carregando...";

  if (!isLoading && data) {
    database_info = (
      <>
        <p>
          <b>Versão</b> do Banco de Dados:{" "}
          <i>{data.dependencies.database.version}</i>
        </p>
        <p>
          Conexões <b>Máximas:</b> <i>{data.dependencies.database.max_conn}</i>
        </p>
        <p>
          Conexões <b>Utilizadas:</b>{" "}
          <i>{data.dependencies.database.used_conn}</i>
        </p>
      </>
    );
  }

  return (
    <>
      <h2>Status do Banco de Dados</h2>
      {database_info}
    </>
  );
}

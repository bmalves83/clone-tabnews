function getLocationOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://bmalves83.com.br";
}

const webserver = {
  origin: getLocationOrigin(),
};

export default webserver;

import fs from "fs";

async function pull() {
  const response = await fetch("https://app.stainless.com/api/spec/documented/autumn/openapi.documented.yml");
  const data = await response.text();

  fs.writeFileSync("./api/openapi.yml", data);
}

pull();
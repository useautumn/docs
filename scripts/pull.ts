async function pull() {
  const response = await fetch("https://app.stainless.com/api/spec/documented/autumn/openapi.documented.yml");
  const data = await response.text();

  await Bun.write("./mintlify/api-reference/openapi.yml", data);
}

pull();
let pyodide;

async function main() {
  pyodide = await loadPyodide();

  // Make your project importable (fastmcp_test lives one dir up)
  await pyodide.mountNativeFS("/fastmcp_test", "../fastmcp_test");

  // Install dependencies (fastmcp + anyio). Skip httpx since we're in browser.
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install("fastmcp")
    await micropip.install("anyio")
  `);

  // Preload your Python code so server/client exist
  await pyodide.runPythonAsync(`
    import anyio
    from fastmcp import FastMCP, Client
    from fastmcp_test.httpbinconnector import HTTPBinConnector

    server = FastMCP("httpbinmcp")
    connector = HTTPBinConnector("httpbinconnector")

    @server.tool
    async def test_httpbin() -> dict:
        return await connector.hit_cors()

    client = Client(server)
  `);
}

function setOutput(text) {
  document.getElementById("output").textContent = text;
}

document.getElementById("list-tools").addEventListener("click", async () => {
  try {
    let tools = await pyodide.runPythonAsync(`
      import anyio
      async def _list():
          async with client:
              return await client.list_tools()
      anyio.run(_list)
    `);
    setOutput(JSON.stringify(tools, null, 2));
  } catch (err) {
    setOutput("Error: " + err);
  }
});

document.getElementById("run-tool").addEventListener("click", async () => {
  try {
    let result = await pyodide.runPythonAsync(`
      import anyio
      async def _call():
          async with client:
              return await client.call_tool("test_httpbin")
      anyio.run(_call)
    `);
    setOutput(JSON.stringify(result, null, 2));
  } catch (err) {
    setOutput("Error: " + err);
  }
});

main();


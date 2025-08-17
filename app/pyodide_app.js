let pyodide;

async function main() {
  pyodide = await loadPyodide();
  pyodide.setDebug(true);
  console.log(pyodide.version);
  await pyodide.loadPackage("micropip");

  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install("./wheels/pyperclip-1.9.0-py3-none-any.whl")
    await micropip.install("rich")
    await micropip.install("pydantic-settings")
    await micropip.install("pydantic")
    await micropip.install("openapi-core")
    await micropip.install("openapi-pydantic")
    await micropip.install("cyclopts")
    await micropip.install("nest-asyncio")
    await micropip.install("exceptiongroup")
    await micropip.install("python-dotenv")
    await micropip.install("authlib")
    await micropip.install("pygments")
    await micropip.install("httpx")
    await micropip.install("starlette")
    await micropip.install("uvicorn")
    await micropip.install("httpx-sse")
    await micropip.install("python-multipart")
    await micropip.install("sse-starlette")
    await micropip.install("jsonschema")

    await micropip.install("fastmcp", deps=False)
    await micropip.install("mcp", deps=False)
    await micropip.install("anyio")
    await micropip.install("./wheels/fastmcp_test-0.1.0-py3-none-any.whl", deps=False)

    print('done')
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
    globals()['server'] = server
    globals()['servertool'] = server.tool
    globals()['test_httpbin'] = test_httpbin
    globals()['client'] = client
    globals()['connector'] = connector
  `);
}

function setOutput(text) {
  document.getElementById("output").textContent = text;
}

document.getElementById("list-tools").addEventListener("click", async () => {
  try {
    let toolsJson = await pyodide.runPythonAsync(`
      import json
      async def _list():
          async with client:
              tools = await client.list_tools()
              return json.dumps(tools, indent=2, default=str)
      await _list()
    `);
    setOutput(toolsJson);
  } catch (err) {
    setOutput("Error: " + err);
  }
});

document.getElementById("run-tool").addEventListener("click", async () => {
  try {
    let toolRes = await pyodide.runPythonAsync(`
      import json
      async def _call():
          async with client:
              callres = await client.call_tool("test_httpbin")
              return json.dumps(callres, indent=2, default=str)
      await _call()
    `);
    setOutput(toolRes);
  } catch (err) {
    setOutput("Error: " + err);
  }
});

main();


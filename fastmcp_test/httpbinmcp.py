import anyio
from fastmcp import FastMCP, Client
from httpbinconnector import HTTPBinConnector

server = FastMCP('httpbinmcp')
connector = HTTPBinConnector('httpbinconnector')

@server.tool
async def test_httpbin() -> list | dict:
    return await  connector.hit_cors()


async def main():
    client = Client(server)
    async with client:
        tools = await client.list_tools()

        test_resp = await client.call_tool('test_httpbin')

        print(tools)
        print(test_resp)


if __name__ == "__main__":
    anyio.run(main)


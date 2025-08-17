from .base_connector import BaseMCPConnector

class HTTPBinConnector(BaseMCPConnector):
    def __init__(self, service: str):
        super().__init__(service)
        self.host = "https://httpbin.org"

    async def hit_cors(self) -> list | dict:
        endpoint = "get"
        resp = await self.make_get(endpoint)
        return await resp.json()


import sys
import anyio


class WrappedHTTPXResponse():
    def __init__(self, resp):
        self._resp = resp
        self.status_code = resp.status_code
        self.headers = resp.headers
        self.url = str(resp.url)
        self.ok = resp.is_success

    async def json(self):
        # tiny await so it’s always awaitable
        await anyio.sleep(0)
        return self._resp.json()

    async def text(self):
        await anyio.sleep(0)
        return self._resp.text

    def raise_for_status(self):
        self._resp.raise_for_status()


if sys.platform == "emscripten":
    from pyodide.http import pyfetch

    class BaseMCPConnector:
        def __init__(self, name: str, **kwargs):
            self.name = name
            self.host = ""

        def build_url(self, endpoint: str) -> str:
            if not self.host:
                return endpoint
            return f"{self.host}/{endpoint.lstrip('/')}"

        def headers(self) -> dict:
            return {}

        async def make_call(self, endpoint: str, method: str, **kwargs):
            url = self.build_url(endpoint)
            headers = kwargs.get("headers", {})
            headers.update(self.headers())
            return await pyfetch(url, method=method, headers=headers, **kwargs)

        async def make_get(self, endpoint, **kwargs):
            return await self.make_call(endpoint, "GET", **kwargs)

        async def make_post(self, endpoint, **kwargs):
            return await self.make_call(endpoint, "POST", **kwargs)

else:
    import httpx

    class BaseMCPConnector:
        def __init__(self, name: str, **kwargs):
            self.name = name
            self.client = httpx.AsyncClient(**kwargs)
            self.host = ""

        def build_url(self, endpoint: str) -> str:
            if not self.host:
                return endpoint
            return f"{self.host}/{endpoint.lstrip('/')}"

        def headers(self) -> dict:
            return {}

        async def make_call(self, endpoint: str, method: str, **kwargs) -> WrappedHTTPXResponse:
            url = self.build_url(endpoint)
            headers = kwargs.get("headers", {})
            headers.update(self.headers())
            resp = await self.client.request(method, url, headers=headers, **kwargs)
            return WrappedHTTPXResponse(resp)


        async def make_get(self, endpoint, **kwargs) -> WrappedHTTPXResponse:
            return await self.make_call(endpoint, "GET", **kwargs)

        async def make_post(self, endpoint, **kwargs) -> WrappedHTTPXResponse:
            return await self.make_call(endpoint, "POST", **kwargs)



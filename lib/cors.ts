const pagesOrigin = "https://sakibou5922.github.io";

function headersFor(request: Request) {
  const headers = new Headers({ Vary: "Origin" });
  if (request.headers.get("Origin") === pagesOrigin) {
    headers.set("Access-Control-Allow-Origin", pagesOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

export function cors<Context>(handler: (request: Request, context: Context) => Promise<Response>) {
  return async (request: Request, context: Context) => {
    const response = await handler(request, context);
    const headers = new Headers(response.headers);
    headersFor(request).forEach((value, key) => headers.set(key, value));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: request.headers.get("Origin") === pagesOrigin ? 204 : 403, headers: headersFor(request) });
}

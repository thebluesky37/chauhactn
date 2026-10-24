"""Máy chủ giả lập API Gateway HTTP API cho môi trường local (Docker).

Chuyển HTTP request thành event payload v2 rồi gọi đúng handler Lambda.
Thay JWT Cognito bằng token cố định: "Authorization: Bearer dev-admin".
Chỉ dùng để test local, KHÔNG deploy lên AWS.
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qsl, urlsplit

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from admin_api import handler as admin  # noqa: E402
from public_api import handler as public  # noqa: E402

DEV_TOKEN = os.environ.get("DEV_ADMIN_TOKEN", "dev-admin")


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "authorization,content-type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")

    def _send(self, status, body="", ctype="application/json"):
        data = body.encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _dispatch(self):
        url = urlsplit(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode() if length else None
        event = {
            "body": body,
            "queryStringParameters": dict(parse_qsl(url.query)) or None,
            "requestContext": {"http": {"method": self.command, "path": url.path}},
        }
        if url.path.startswith("/admin"):
            if self.headers.get("Authorization") != f"Bearer {DEV_TOKEN}":
                return self._send(401, json.dumps({"message": "Unauthorized"}))
            event["requestContext"]["authorizer"] = {
                "jwt": {"claims": {"email": "admin@local", "cognito:groups": "[admin]"}}
            }
            fn = admin.handler
        elif url.path.startswith("/public"):
            fn = public.handler
        else:
            return self._send(404, json.dumps({"message": "Không tìm thấy"}))
        try:
            res = fn(event, None)
        except Exception as e:  # giống Lambda: lỗi không bắt được trả 500
            import traceback

            traceback.print_exc()
            return self._send(500, json.dumps({"message": f"Internal Server Error: {e}"}))
        self._send(res["statusCode"], res["body"])

    def do_OPTIONS(self):
        self._send(204)

    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = _dispatch


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"API local lắng nghe cổng {port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()

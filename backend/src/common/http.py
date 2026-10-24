import json
import re
from decimal import Decimal


class HttpError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def _default(o):
    if isinstance(o, Decimal):
        return int(o) if o == o.to_integral_value() else float(o)
    if isinstance(o, set):
        return sorted(o)
    raise TypeError(type(o))


def response(status, body=None):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=_default, ensure_ascii=False) if body is not None else "",
    }


def parse_body(event):
    raw = event.get("body") or "{}"
    try:
        data = json.loads(raw)
    except ValueError:
        raise HttpError(400, "Body không phải JSON hợp lệ")
    if not isinstance(data, dict):
        raise HttpError(400, "Body phải là một object JSON")
    return data


class Router:
    """Bộ định tuyến nhỏ, không phụ thuộc thư viện ngoài."""

    def __init__(self, prefix):
        self.prefix = prefix
        self.routes = []

    def route(self, method, pattern):
        regex = re.compile("^" + re.sub(r"\{(\w+)\}", r"(?P<\1>[^/]+)", pattern) + "$")

        def deco(fn):
            self.routes.append((method, regex, fn))
            return fn

        return deco

    def handle(self, event):
        http = event["requestContext"]["http"]
        method, path = http["method"], http["path"]
        if path.startswith(self.prefix):
            path = path[len(self.prefix):] or "/"
        try:
            for m, regex, fn in self.routes:
                match = regex.match(path)
                if match and m == method:
                    return fn(event, **match.groupdict())
            raise HttpError(404, "Không tìm thấy")
        except HttpError as e:
            return response(e.status, {"message": e.message})

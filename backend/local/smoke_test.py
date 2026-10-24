"""Smoke test end-to-end cho môi trường Docker local.

Chạy sau `docker compose -f docker-compose.local.yml up -d --build`:
    python3 backend/local/smoke_test.py
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("API_URL", "http://localhost:8000")
HEADERS = {"Authorization": "Bearer dev-admin", "Content-Type": "application/json"}


def call(method, path, body=None, auth=True):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=HEADERS if auth else {"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            text = r.read().decode()
            return r.status, json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        return e.code, json.loads(text) if text else None


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        sys.exit(1)


check("admin không token bị 401", call("GET", "/admin/projects", auth=False)[0] == 401)

_, p = call("POST", "/admin/projects", {"name": "Smoke", "startDate": "2026-01-01", "plannedEndDate": "2026-12-31"})
pid = p["id"]
check("dự án mới mặc định tắt Khách xem", p["guestVisible"] is False)
check("Khách không mở được dự án tắt (404)", call("GET", f"/public/projects/{pid}", auth=False)[0] == 404)

call("PATCH", f"/admin/projects/{pid}", {"guestVisible": True})
check("Khách thấy dự án sau khi bật", call("GET", f"/public/projects/{pid}", auth=False)[0] == 200)

_, party = call("POST", f"/admin/projects/{pid}/parties", {"type": "investor", "name": "CĐT"})

# Upload multipart thật: 2 phần (phần 16MB + phần còn lại) lên LocalStack.
size = 20 * 1024 * 1024
data = os.urandom(size)
_, init = call("POST", f"/admin/projects/{pid}/files/init", {"filename": "ban ve.dwg", "size": size})
check("init trả 2 URL", len(init["urls"]) == 2)
parts = []
for i, url in enumerate(init["urls"]):
    chunk = data[i * init["partSize"]:(i + 1) * init["partSize"]]
    with urllib.request.urlopen(urllib.request.Request(url, data=chunk, method="PUT")) as r:
        parts.append({"PartNumber": i + 1, "ETag": r.headers["ETag"]})
check("ghép multipart", call("POST", f"/admin/projects/{pid}/files/complete", {"key": init["key"], "uploadId": init["uploadId"], "parts": parts})[1]["size"] == size)

body = {"partyType": "investor", "partyId": party["id"], "sentDate": "2026-02-01", "files": [{"name": "ban ve.dwg", "key": init["key"]}]}
_, u1 = call("POST", f"/admin/projects/{pid}/uploads", body)
check("v1", u1["files"][0]["version"] == 1)
_, u2 = call("POST", f"/admin/projects/{pid}/uploads", body)
check("đăng lại cùng tên thành v2", u2["files"][0]["version"] == 2)

_, view = call("GET", f"/public/projects/{pid}", auth=False)
files = [f for u in view["uploads"] for f in u["files"]]
check("Khách thấy tên file nhưng không có khóa S3", files and all("key" not in f for f in files))
check("Khách không có endpoint tải file", call("GET", f"/public/projects/{pid}/files/download?key={init['key']}", auth=False)[0] == 404)

_, dl = call("GET", f"/admin/projects/{pid}/files/download?" + urllib.parse.urlencode({"key": init["key"]}))
with urllib.request.urlopen(dl["url"]) as r:
    check("Admin tải về đúng nội dung", r.read() == data)

call("PATCH", f"/admin/projects/{pid}/uploads/{u2['id']}", {"hidden": True})
_, view = call("GET", f"/public/projects/{pid}", auth=False)
check("bản ghi ẩn biến mất khỏi Khách", len(view["uploads"]) == 1)

call("PATCH", f"/admin/projects/{pid}", {"guestVisible": False})
check("tắt xong Khách không mở được nữa", call("GET", f"/public/projects/{pid}", auth=False)[0] == 404)
print("TẤT CẢ ĐẠT")

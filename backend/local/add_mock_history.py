"""Thêm nhiều bản ghi đăng tải giả vào một dự án trên Docker local để thử timeline (không dùng cho AWS thật).

    python3 backend/local/add_mock_history.py [tên dự án]     # mặc định: dự án mẫu "Nhà máy ABC"
Cần có sẵn dự án và các bên (chạy seed_sample.py trước).
"""
import json
import os
import random
import sys
import urllib.request
from datetime import date, timedelta

API = os.environ.get("API_URL", "http://localhost:8000")
HEADERS = {"Authorization": "Bearer dev-admin", "Content-Type": "application/json"}


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, headers=HEADERS, method=method)
    with urllib.request.urlopen(req) as r:
        text = r.read().decode()
        return json.loads(text) if text else None


def upload(pid, name, content):
    init = call("POST", f"/admin/projects/{pid}/files/init", {"filename": name, "size": len(content)})
    req = urllib.request.Request(init["urls"][0], data=content, method="PUT")
    with urllib.request.urlopen(req) as r:
        etag = r.headers["ETag"]
    call("POST", f"/admin/projects/{pid}/files/complete", {"key": init["key"], "uploadId": init["uploadId"], "parts": [{"PartNumber": 1, "ETag": etag}]})
    return {"name": name, "key": init["key"]}


want = sys.argv[1] if len(sys.argv) > 1 else "Nhà máy ABC"
projects = [p for p in call("GET", "/admin/projects")["projects"] if p["name"].startswith(want)]
if not projects:
    sys.exit(f"Không thấy dự án “{want}”. Chạy backend/local/seed_sample.py trước.")
pid = projects[0]["id"]
view = call("GET", f"/admin/projects/{pid}")
parties, tasks = view["parties"], view["tasks"]
by_type = lambda t: [x for x in parties if x["type"] == t]
if not parties:
    sys.exit("Dự án chưa có bên nào.")

rnd = random.Random(7)  # cố định để lần nào cũng ra cùng dữ liệu
TEXTS = {
    "investor": ["Phê duyệt biện pháp thi công", "Yêu cầu bổ sung hồ sơ nghiệm thu", "Xác nhận khối lượng đợt {n}", "Góp ý bản vẽ shop"],
    "architect": ["Bản vẽ kiến trúc điều chỉnh rev {L}", "Chi tiết hoàn thiện sảnh", "Cập nhật mặt bằng bố trí thiết bị"],
    "coordinator": ["Báo cáo tiến độ tuần {n}", "Biên bản họp phối hợp MEP số {n}", "Bản vẽ phối hợp điện nước tầng {n}"],
    "subcontractor": ["Nhật ký thi công ngày {d}", "Báo cáo khối lượng hoàn thành đợt {n}", "Hình ảnh hiện trường tuần {n}", "Hồ sơ vật tư nhập kho đợt {n}"],
}
EXT = {"investor": ["pdf", "docx"], "architect": ["dwg", "pdf"], "coordinator": ["xlsx", "pdf"], "subcontractor": ["xlsx", "jpg", "docx", "pdf"]}
NOTES = ["", "", "", "Chờ phản hồi từ CĐT", "Cần kiểm tra lại số liệu", "Đã đối chiếu với bản vẽ"]

start = date(2026, 1, 12)
created = 0
for i in range(36):
    when = start + timedelta(days=i * 7 + rnd.randint(0, 3))
    t = rnd.choices(["investor", "architect", "coordinator", "subcontractor"], weights=[2, 1, 3, 5])[0]
    if not by_type(t):
        continue
    party = rnd.choice(by_type(t))
    body = {"partyType": t, "partyId": party["id"], "sentDate": when.isoformat()}
    if t == "subcontractor":
        mine = [k for k in tasks if k["partyId"] == party["id"]]
        if not mine:
            continue
        body["taskId"] = rnd.choice(mine)["id"]
    if t == "coordinator":
        body["recipientIds"] = [rnd.choice(parties)["id"]]
    if rnd.random() < 0.5:
        end = when - timedelta(days=1)
        body["periodFrom"], body["periodTo"] = (end - timedelta(days=6)).isoformat(), end.isoformat()
    text = rnd.choice(TEXTS[t]).format(n=i // 3 + 1, L="ABCD"[i % 4], d=when.strftime("%d/%m"))
    body["description"] = text + (f"\nHạng mục: ghi chú chi tiết số {i + 1}" if rnd.random() < 0.4 else "")
    body["adminNote"] = rnd.choice(NOTES)
    nfiles = rnd.choices([0, 1, 2, 3], weights=[1, 4, 3, 1])[0]
    body["files"] = [
        upload(pid, f"{t[:3]}-{when:%Y%m%d}-{k + 1}.{rnd.choice(EXT[t])}", os.urandom(200) * rnd.randint(1, 20))
        for k in range(nfiles)
    ]
    rec = call("POST", f"/admin/projects/{pid}/uploads", body)
    if i % 11 == 5:  # vài bản ghi bị ẩn
        call("PATCH", f"/admin/projects/{pid}/uploads/{rec['id']}", {"hidden": True})
    created += 1

print(f"Đã thêm {created} bản ghi vào “{projects[0]['name']}” → http://localhost:5173/admin/projects/{pid}")

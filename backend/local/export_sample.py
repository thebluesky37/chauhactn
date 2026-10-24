"""Tạo dữ liệu mẫu qua API local rồi tải về file Excel báo cáo: python3 backend/local/export_sample.py <đường dẫn .xlsx>"""
import json, os, sys, urllib.parse, urllib.request

API = os.environ.get("API_URL", "http://localhost:8000")
H = {"Authorization": "Bearer dev-admin", "Content-Type": "application/json"}


def call(m, path, body=None):
    r = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, headers=H, method=m)
    with urllib.request.urlopen(r) as x:
        return json.loads(x.read() or b"null")


def put_file(pid, name, data):
    init = call("POST", f"/admin/projects/{pid}/files/init", {"filename": name, "size": len(data)})
    with urllib.request.urlopen(urllib.request.Request(init["urls"][0], data=data, method="PUT")) as r:
        etag = r.headers["ETag"]
    call("POST", f"/admin/projects/{pid}/files/complete", {"key": init["key"], "uploadId": init["uploadId"], "parts": [{"PartNumber": 1, "ETag": etag}]})
    return {"name": name, "key": init["key"]}


p = call("POST", "/admin/projects", {"name": "Tòa nhà văn phòng Hà Châu", "startDate": "2026-01-05", "plannedEndDate": "2026-12-20"})
pid = p["id"]
call("PUT", f"/admin/projects/{pid}/note", {"text": "Dự án giai đoạn 2.\nƯu tiên hoàn thành phần móng trước mùa mưa."})
party = lambda t, n, c="", ph="", e="": call("POST", f"/admin/projects/{pid}/parties", {"type": t, "name": n, "contactName": c, "phone": ph, "email": e})
cdt = party("investor", "Công ty CP Đầu tư Hà Châu", "Nguyễn Văn An", "0901 234 567", "an@hachau.vn")
ktr = party("architect", "Studio Kiến trúc Việt", "Trần Thị Bình", "0912 345 678", "binh@studioviet.vn")
pho = party("coordinator", "Phối hợp KT Minh Phát", "Lê Minh", "0933 111 222", "minh@minhphat.vn")
t1 = party("subcontractor", "Thầu cơ khí Đại Dương", "Phạm Dũng", "0987 654 321", "dung@daiduong.vn")
t2 = party("subcontractor", "Thầu điện nước Sao Mai", "Võ Hoa", "0977 888 999", "hoa@saomai.vn")
k1 = call("POST", f"/admin/projects/{pid}/tasks", {"partyId": t1["id"], "name": "Thi công móng", "startDate": "2026-02-01", "endDate": "2026-04-30"})
k2 = call("POST", f"/admin/projects/{pid}/tasks", {"partyId": t2["id"], "name": "Hệ thống điện tầng 1-3", "startDate": "2026-05-01", "endDate": "2026-08-15"})
call("PATCH", f"/admin/projects/{pid}", {"guestVisible": True})
up = lambda **kw: call("POST", f"/admin/projects/{pid}/uploads", kw)
up(partyType="investor", partyId=cdt["id"], sentDate="2026-01-10", description="Phê duyệt ngân sách đợt 1", files=[put_file(pid, "ngan-sach.xlsx", b"x" * 300000)])
up(partyType="architect", partyId=ktr["id"], sentDate="2026-01-20", description="Bản vẽ mặt bằng tầng 1", adminNote="Bản vẽ sửa lần 2", files=[put_file(pid, "mat-bang-T1.dwg", b"x" * 2_500_000)])
up(partyType="coordinator", partyId=pho["id"], recipientIds=[ktr["id"], t1["id"]], sentDate="2026-02-05", periodFrom="2026-02-01", periodTo="2026-02-04", description="Phối hợp kết cấu - kiến trúc", files=[put_file(pid, "phoi-hop.pdf", b"x" * 900000)])
a = up(partyType="subcontractor", partyId=t1["id"], taskId=k1["id"], sentDate="2026-03-01", periodFrom="2026-02-20", periodTo="2026-02-28", description="Tiến độ đổ móng M1", files=[put_file(pid, "tien-do.xlsx", b"x" * 120000), put_file(pid, "anh-hien-truong.jpg", b"x" * 2_500_000)])
up(partyType="subcontractor", partyId=t1["id"], taskId=k1["id"], sentDate="2026-03-08", periodFrom="2026-03-01", periodTo="2026-03-07", description="Tiến độ đổ móng M2", files=[put_file(pid, "tien-do.xlsx", b"x" * 130000)])
b = up(partyType="subcontractor", partyId=t2["id"], taskId=k2["id"], sentDate="2026-05-10", description="Gửi nhầm bên", files=[put_file(pid, "sai.pdf", b"x" * 1000)])
call("PATCH", f"/admin/projects/{pid}/uploads/{b['id']}", {"hidden": True})
r = call("GET", f"/admin/projects/{pid}/export")
urllib.request.urlretrieve(r["url"], sys.argv[1])
print(r["filename"], "->", sys.argv[1])

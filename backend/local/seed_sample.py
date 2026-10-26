"""Tạo một dự án mẫu trên môi trường Docker local (không dùng cho AWS thật).

    python3 backend/local/seed_sample.py
"""
import json
import os
import urllib.request

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


p = call("POST", "/admin/projects", {"name": "Nhà máy ABC – Giai đoạn 1", "startDate": "2026-01-05", "plannedEndDate": "2026-12-20"})
pid = p["id"]
call("PATCH", f"/admin/projects/{pid}", {"guestVisible": True})
call("PUT", f"/admin/projects/{pid}/note", {"text": "Dự án mẫu để thử nghiệm.\nTiến độ đang đúng kế hoạch.\nCần chốt bản vẽ MEP trước tháng 3."})


def party(type_, name, contact, phone, email, scopes=(), notes=None):
    return call("POST", f"/admin/projects/{pid}/parties", {
        "type": type_, "name": name, "contactName": contact, "phone": phone, "email": email,
        "scopeIds": list(scopes), "scopeNotes": notes or {},
    })


cdt = party("investor", "Công ty CP ABC", "Nguyễn Văn An", "0901000001", "an@abc.vn", ["I.1", "II.1", "II.3"], {"I.1": "CĐT tự cấp nguồn trung thế"})
kt = party("architect", "Kiến trúc Việt", "Trần Thị Bình", "0901000002", "binh@ktv.vn")
mep = party("coordinator", "Tổng thầu MEP Delta", "Lê Văn Cường", "0901000003", "cuong@delta.vn",
            ["I.2", "I.3", "III.1", "III.2", "IV.1", "IV.2", "V.1", "V.3"], {"V.1": "Theo QCVN 06", "III.2": "Gồm quạt hút xưởng"})
tp1 = party("subcontractor", "Điện Sáng Tạo", "Phạm Đức Dũng", "0901000004", "dung@dst.vn", ["I.2", "I.3", "I.4"], {"I.4": "Cấp nguồn 12 máy in"})
tp2 = party("subcontractor", "Nước & Khí Hòa Bình", "Võ Thị Hoa", "0901000005", "hoa@hb.vn", ["IV.1", "IV.2", "IV.3", "IV.4", "VII.1"])
tp3 = party("subcontractor", "PCCC An Toàn", "Đỗ Minh Khoa", "0901000006", "khoa@pccc.vn", ["V.1", "V.2", "V.3", "V.4", "V.5", "V.6"], {"V.2": "Khí FM200"})

tasks = {}
for key, party_, name, s, e in [
    ("dien", tp1, "Thi công hệ thống điện hạ thế", "2026-02-01", "2026-05-30"),
    ("nuoc", tp2, "Cấp thoát nước tầng 1–2", "2026-03-01", "2026-06-15"),
    ("pccc", tp3, "Lắp đặt báo cháy và chữa cháy", "2026-04-01", "2026-08-30"),
]:
    tasks[key] = call("POST", f"/admin/projects/{pid}/tasks", {"partyId": party_["id"], "name": name, "startDate": s, "endDate": e})

f = lambda n, c=b"mau": upload(pid, n, c * 20)
for body in [
    {"partyType": "investor", "partyId": cdt["id"], "sentDate": "2026-01-20", "description": "Phê duyệt bản vẽ thiết kế cơ sở\nBổ sung yêu cầu về nguồn dự phòng", "files": [f("phe-duyet-tkcs.pdf")]},
    {"partyType": "coordinator", "partyId": mep["id"], "recipientIds": [cdt["id"], tp1["id"]], "sentDate": "2026-02-10", "periodFrom": "2026-02-01", "periodTo": "2026-02-09",
     "description": "Báo cáo tiến độ tuần 6", "adminNote": "Chờ vật tư điều hòa", "files": [f("bao-cao-tuan-6.xlsx"), f("mat-bang-mep.dwg")]},
    {"partyType": "subcontractor", "partyId": tp1["id"], "taskId": tasks["dien"]["id"], "sentDate": "2026-03-05",
     "description": "Hoàn thành kéo cáp tầng 1\nĐang đấu nối tủ điện", "files": [f("nhat-ky-dien-t3.docx"), f("anh-hien-truong.jpg")]},
    {"partyType": "subcontractor", "partyId": tp1["id"], "taskId": tasks["dien"]["id"], "sentDate": "2026-04-02",
     "description": "Cập nhật tiến độ tháng 4", "files": [f("nhat-ky-dien-t3.docx", b"v2")]},
    {"partyType": "subcontractor", "partyId": tp3["id"], "taskId": tasks["pccc"]["id"], "sentDate": "2026-04-15", "description": "Bản vẽ shop báo cháy", "files": []},
    {"partyType": "architect", "partyId": kt["id"], "sentDate": "2026-02-25", "description": "Bản vẽ kiến trúc điều chỉnh rev B", "files": [f("kien-truc-revB.pdf")]},
]:
    call("POST", f"/admin/projects/{pid}/uploads", body)

print("Đã tạo dự án mẫu:", p["name"], f"→ http://localhost:5173/admin/projects/{pid}")

"""Lambda cho Admin: đọc và ghi. API Gateway đã kiểm tra JWT Cognito; ở đây kiểm tra lại nhóm admin."""
import math
import os
import re
from datetime import datetime, timedelta, timezone

from common import db
from common.http import HttpError, Router, parse_body, response
from common import scopes
from common.scopes import SCOPE_PARTY_TYPES

router = Router("/admin")

STATUSES = {"in_progress", "paused", "done"}
PARTY_TYPES = {"investor", "architect", "coordinator", "subcontractor"}
ALLOWED_EXT = {
    ".xls", ".xlsx", ".csv", ".doc", ".docx", ".pdf",
    ".dwg", ".dxf", ".rvt", ".rfa", ".jpg", ".jpeg", ".png",
}
VN = timezone(timedelta(hours=7))
PART_SIZE = 16 * 1024 * 1024
MAX_FILE_SIZE = 500 * 1024 * 1024  # giới hạn tạm, cần xác nhận (mục 8)


def _claims(event):
    return event["requestContext"].get("authorizer", {}).get("jwt", {}).get("claims", {})


def _require_admin(event):
    groups = str(_claims(event).get("cognito:groups", ""))
    if "admin" not in re.findall(r"[\w-]+", groups):
        raise HttpError(403, "Không có quyền Admin")


def _actor(event):
    return _claims(event).get("email") or _claims(event).get("sub", "unknown")


def _audit(event, action, detail):
    now = db.now_iso()
    db.table().put_item(
        Item={
            "PK": f"AUDIT#{now[:10]}",
            "SK": f"{now}#{db.new_id()}",
            "actor": _actor(event),
            "action": action,
            "detail": detail,
            "createdAt": now,
        }
    )


def _require(data, *fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise HttpError(400, "Thiếu trường bắt buộc: " + ", ".join(missing))


def _clean_scopes(party_type, scope_ids, catalog):
    """Kiểm tra scope hợp lệ theo danh mục hiện tại; Kiến trúc không có scope. Trả theo thứ tự danh mục, không trùng."""
    if party_type not in SCOPE_PARTY_TYPES:
        return []
    order = scopes.scope_ids(catalog)
    wanted = set(scope_ids or [])
    unknown = wanted - set(order)
    if unknown:
        raise HttpError(400, "Scope không hợp lệ: " + ", ".join(sorted(unknown)))
    return [sid for sid in order if sid in wanted]


def _clean_scope_notes(scope_ids, notes):
    """Ghi chú theo scope: chỉ giữ cho scope đã chọn, bỏ ghi chú rỗng."""
    out = {}
    for sid, text in (notes or {}).items():
        if sid in scope_ids and isinstance(text, str) and text.strip():
            out[sid] = text.strip()
    return out


def _project_or_404(project_id):
    item = db.get_project_item(project_id)
    if not item:
        raise HttpError(404, "Không tìm thấy dự án")
    return item


def _write_project(item):
    # GSI1 thưa: chỉ dự án bật cho Khách xem mới có thuộc tính GSI1PK.
    item.pop("GSI1PK", None)
    item.pop("GSI1SK", None)
    if item.get("guestVisible"):
        item["GSI1PK"] = "VISIBILITY#public"
        item["GSI1SK"] = item["createdAt"]
    db.table().put_item(Item=item)


# ---------- Dự án ----------

@router.route("GET", "/projects")
def list_projects(event):
    _require_admin(event)
    resp = db.table().scan(
        FilterExpression="SK = :m", ExpressionAttributeValues={":m": "META"}
    )
    projects = sorted((db.strip_keys(i) for i in resp["Items"]), key=lambda p: p["createdAt"], reverse=True)
    return response(200, {"projects": projects})


@router.route("POST", "/projects")
def create_project(event):
    _require_admin(event)
    data = parse_body(event)
    _require(data, "name", "startDate", "plannedEndDate")
    if data["plannedEndDate"] < data["startDate"]:
        raise HttpError(400, "Ngày hoàn thành không được trước ngày khởi tạo")
    pid = db.new_id()
    item = {
        "PK": f"PROJECT#{pid}",
        "SK": "META",
        "id": pid,
        "name": data["name"],
        "startDate": data["startDate"],
        "plannedEndDate": data["plannedEndDate"],
        "actualEndDate": data.get("actualEndDate"),
        "status": "in_progress",
        "guestVisible": False,  # mặc định tắt
        "createdAt": db.now_iso(),
    }
    _write_project(item)
    _audit(event, "project.create", {"id": pid})
    return response(201, db.strip_keys(item))


@router.route("GET", "/projects/{project_id}")
def get_project(event, project_id):
    _require_admin(event)
    _project_or_404(project_id)
    return response(200, db.project_view(project_id))


@router.route("PATCH", "/projects/{project_id}")
def update_project(event, project_id):
    _require_admin(event)
    item = _project_or_404(project_id)
    data = parse_body(event)
    for f in ("name", "startDate", "plannedEndDate", "actualEndDate"):
        if f in data:
            item[f] = data[f]
    if "status" in data:
        if data["status"] not in STATUSES:
            raise HttpError(400, "Trạng thái không hợp lệ")
        item["status"] = data["status"]
    if item["plannedEndDate"] < item["startDate"]:
        raise HttpError(400, "Ngày hoàn thành không được trước ngày khởi tạo")
    if "guestVisible" in data:
        if bool(data["guestVisible"]) != bool(item.get("guestVisible")):
            _audit(event, "project.guest_visible", {"id": project_id, "value": bool(data["guestVisible"])})
        item["guestVisible"] = bool(data["guestVisible"])
    _write_project(item)
    return response(200, db.strip_keys(item))


@router.route("DELETE", "/projects/{project_id}")
def delete_project(event, project_id):
    """Xóa vĩnh viễn dự án cùng mọi dữ liệu và file đã tải lên. Không hoàn tác được."""
    _require_admin(event)
    item = _project_or_404(project_id)
    removed = db.delete_project_data(project_id)
    _audit(event, "project.delete", {"id": project_id, "name": item["name"], **removed})
    return response(200, {"deleted": project_id, **removed})


@router.route("PUT", "/projects/{project_id}/note")
def set_note(event, project_id):
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    now = db.now_iso()
    db.table().put_item(
        Item={
            "PK": f"PROJECT#{project_id}",
            "SK": f"NOTE#{now}",
            "text": data.get("text", ""),
            "createdAt": now,
        }
    )
    return response(200, {"createdAt": now})


# ---------- Danh mục scope công việc (dùng chung mọi dự án) ----------

@router.route("GET", "/scopes")
def get_scopes(event):
    _require_admin(event)
    return response(200, {"groups": db.get_scope_catalog()})


@router.route("PUT", "/scopes")
def put_scopes(event):
    """Lưu danh mục. Scope bị xóa sẽ được gỡ khỏi mọi bên (mọi dự án) đang dùng."""
    _require_admin(event)
    data = parse_body(event)
    try:
        groups = scopes.normalize(data.get("groups"))
    except ValueError as e:
        raise HttpError(400, str(e))
    removed = set(scopes.scope_ids(db.get_scope_catalog())) - set(scopes.scope_ids(groups))
    affected = 0
    if removed:
        resp = db.table().scan(FilterExpression="begins_with(SK, :p)", ExpressionAttributeValues={":p": "PARTY#"})
        items = list(resp["Items"])
        while "LastEvaluatedKey" in resp:
            resp = db.table().scan(
                FilterExpression="begins_with(SK, :p)", ExpressionAttributeValues={":p": "PARTY#"},
                ExclusiveStartKey=resp["LastEvaluatedKey"],
            )
            items.extend(resp["Items"])
        for it in items:
            ids = it.get("scopeIds", [])
            if removed & set(ids):
                it["scopeIds"] = [i for i in ids if i not in removed]
                it["scopeNotes"] = {k: v for k, v in it.get("scopeNotes", {}).items() if k not in removed}
                db.table().put_item(Item=it)
                affected += 1
    db.put_scope_catalog(groups)
    _audit(event, "scopes.update", {"removed": len(removed), "affectedParties": affected})
    return response(200, {"groups": groups, "affectedParties": affected})


# ---------- Các bên và hạng mục ----------

@router.route("POST", "/projects/{project_id}/parties")
def add_party(event, project_id):
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    _require(data, "type", "name")
    if data["type"] not in PARTY_TYPES:
        raise HttpError(400, "Loại bên không hợp lệ")
    pid = db.new_id()
    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": f"PARTY#{pid}",
        "id": pid,
        "type": data["type"],
        "name": data["name"],
        "contactName": data.get("contactName", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "scopeIds": _clean_scopes(data["type"], data.get("scopeIds"), db.get_scope_catalog()),
    }
    item["scopeNotes"] = _clean_scope_notes(item["scopeIds"], data.get("scopeNotes"))
    db.table().put_item(Item=item)
    return response(201, db.strip_keys(item))


@router.route("PATCH", "/projects/{project_id}/parties/{party_id}")
def update_party(event, project_id, party_id):
    """Sửa thông tin và scope của một bên."""
    _require_admin(event)
    resp = db.table().get_item(Key={"PK": f"PROJECT#{project_id}", "SK": f"PARTY#{party_id}"})
    item = resp.get("Item")
    if not item:
        raise HttpError(404, "Không tìm thấy bên tham gia")
    data = parse_body(event)
    for f in ("name", "contactName", "phone", "email"):
        if f in data:
            item[f] = data[f]
    if not item.get("name"):
        raise HttpError(400, "Tên không được để trống")
    if "scopeIds" in data:
        item["scopeIds"] = _clean_scopes(item["type"], data["scopeIds"], db.get_scope_catalog())
    if "scopeIds" in data or "scopeNotes" in data:
        item["scopeNotes"] = _clean_scope_notes(
            item.get("scopeIds", []), data.get("scopeNotes", item.get("scopeNotes"))
        )
    db.table().put_item(Item=item)
    _audit(event, "party.update", {"project": project_id, "id": party_id})
    return response(200, db.strip_keys(item))


@router.route("DELETE", "/projects/{project_id}/parties/{party_id}")
def delete_party(event, project_id, party_id):
    """Xóa một bên. Từ chối nếu còn hạng mục hoặc bản ghi đăng tải liên quan, để không mất dữ liệu."""
    _require_admin(event)
    key = {"PK": f"PROJECT#{project_id}", "SK": f"PARTY#{party_id}"}
    item = db.table().get_item(Key=key).get("Item")
    if not item:
        raise HttpError(404, "Không tìm thấy bên tham gia")
    tasks = [t for t in db.query_all(f"PROJECT#{project_id}", "TASK#") if t["partyId"] == party_id]
    uploads = [
        u for u in db.query_all(f"PROJECT#{project_id}", "UPLOAD#")
        if u["partyId"] == party_id or party_id in u.get("recipientIds", [])
    ]
    if tasks or uploads:
        raise HttpError(
            409,
            f"Không thể xóa: bên này còn {len(tasks)} hạng mục và {len(uploads)} bản ghi đăng tải liên quan. "
            "Xóa các mục đó trước.",
        )
    db.table().delete_item(Key=key)
    _audit(event, "party.delete", {"project": project_id, "id": party_id, "name": item["name"]})
    return response(200, {"deleted": party_id})


@router.route("POST", "/projects/{project_id}/tasks")
def add_task(event, project_id):
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    _require(data, "partyId", "name", "startDate", "endDate")
    if data["endDate"] < data["startDate"]:
        raise HttpError(400, "Ngày kết thúc không được trước ngày bắt đầu")
    tid = db.new_id()
    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": f"TASK#{tid}",
        "id": tid,
        "partyId": data["partyId"],
        "name": data["name"],
        "startDate": data["startDate"],
        "endDate": data["endDate"],
    }
    db.table().put_item(Item=item)
    return response(201, db.strip_keys(item))


# ---------- Đăng tải file ----------

def _check_filename(name, size):
    ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED_EXT:
        raise HttpError(400, f"Định dạng {ext or '(không có)'} không được hỗ trợ")
    if size > MAX_FILE_SIZE:
        raise HttpError(400, "File vượt quá dung lượng cho phép")


@router.route("POST", "/projects/{project_id}/files/init")
def init_upload(event, project_id):
    """Bước 1: tạo multipart upload và trả presigned URL cho từng phần."""
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    _require(data, "filename", "size")
    size = int(data["size"])
    _check_filename(data["filename"], size)
    safe = re.sub(r"[^\w.\-]+", "_", data["filename"])
    key = f"projects/{project_id}/{db.new_id()}/{safe}"
    mp = db.s3().create_multipart_upload(
        Bucket=db.bucket(), Key=key, ContentType=data.get("contentType") or "application/octet-stream"
    )
    parts = max(1, math.ceil(size / PART_SIZE))
    urls = [
        db.s3_presign().generate_presigned_url(
            "upload_part",
            Params={"Bucket": db.bucket(), "Key": key, "UploadId": mp["UploadId"], "PartNumber": n},
            ExpiresIn=3600,
        )
        for n in range(1, parts + 1)
    ]
    return response(200, {"key": key, "uploadId": mp["UploadId"], "partSize": PART_SIZE, "urls": urls})


@router.route("POST", "/projects/{project_id}/files/complete")
def complete_upload(event, project_id):
    """Bước 3: ghép các phần đã tải lên S3."""
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    _require(data, "key", "uploadId", "parts")
    if not data["key"].startswith(f"projects/{project_id}/"):
        raise HttpError(400, "Khóa file không thuộc dự án")
    db.s3().complete_multipart_upload(
        Bucket=db.bucket(),
        Key=data["key"],
        UploadId=data["uploadId"],
        MultipartUpload={"Parts": [{"PartNumber": p["PartNumber"], "ETag": p["ETag"]} for p in data["parts"]]},
    )
    head = db.s3().head_object(Bucket=db.bucket(), Key=data["key"])
    return response(200, {"key": data["key"], "size": head["ContentLength"]})


@router.route("POST", "/projects/{project_id}/uploads")
def create_upload_record(event, project_id):
    """Bước 4: ghi bản ghi đăng tải sau khi file đã có trên S3."""
    _require_admin(event)
    _project_or_404(project_id)
    data = parse_body(event)
    _require(data, "partyType", "partyId", "sentDate")
    if data["partyType"] not in PARTY_TYPES:
        raise HttpError(400, "Loại bên không hợp lệ")
    if data["partyType"] == "subcontractor" and not data.get("taskId"):
        raise HttpError(400, "Thầu phụ phải chọn hạng mục công việc")
    if data["partyType"] == "coordinator" and not data.get("recipientIds"):
        raise HttpError(400, "Tổng thầu MEP phải chọn bên nhận")

    existing = db.query_all(f"PROJECT#{project_id}", "UPLOAD#")
    files = []
    for f in data.get("files") or []:
        if not f["key"].startswith(f"projects/{project_id}/"):
            raise HttpError(400, "Khóa file không thuộc dự án")
        head = db.s3().head_object(Bucket=db.bucket(), Key=f["key"])  # lỗi nếu file chưa có trên S3
        version = 1 + max(
            (
                pf.get("version", 1)
                for u in existing
                if u["partyId"] == data["partyId"] and u.get("taskId") == data.get("taskId")
                for pf in u.get("files", [])
                if pf["name"] == f["name"]
            ),
            default=0,
        )
        files.append({"name": f["name"], "key": f["key"], "size": head["ContentLength"], "version": version})

    now = db.now_iso()
    uid = db.new_id()
    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": f"UPLOAD#{now}#{uid}",
        "id": uid,
        "partyType": data["partyType"],
        "partyId": data["partyId"],
        "taskId": data.get("taskId"),
        "recipientIds": data.get("recipientIds", []),
        "sentDate": data["sentDate"],
        "periodFrom": data.get("periodFrom"),
        "periodTo": data.get("periodTo"),
        "description": data.get("description", ""),
        "adminNote": data.get("adminNote", ""),
        "files": files,
        "hidden": False,
        "createdAt": now,
    }
    db.table().put_item(Item=item)
    _audit(event, "upload.create", {"project": project_id, "id": uid, "files": [f["name"] for f in files]})
    return response(201, db.strip_keys(item))


def _upload_item(project_id, upload_id):
    for u in db.query_all(f"PROJECT#{project_id}", "UPLOAD#"):
        if u["id"] == upload_id:
            return u
    raise HttpError(404, "Không tìm thấy bản ghi")


@router.route("PATCH", "/projects/{project_id}/uploads/{upload_id}")
def edit_upload(event, project_id, upload_id):
    """Sửa thông tin bản ghi hoặc ẩn / hiện; lưu nội dung trước và sau khi sửa."""
    _require_admin(event)
    item = _upload_item(project_id, upload_id)
    data = parse_body(event)
    editable = (
        "partyType", "partyId", "taskId", "recipientIds", "sentDate",
        "periodFrom", "periodTo", "description", "adminNote", "hidden",
    )
    before = {f: item.get(f) for f in editable}
    for f in editable:
        if f in data:
            item[f] = data[f]
    after = {f: item.get(f) for f in editable}
    now = db.now_iso()
    db.table().put_item(Item=item)
    db.table().put_item(
        Item={
            "PK": f"UPLOAD#{upload_id}",
            "SK": f"REV#{now}",
            "actor": _actor(event),
            "before": before,
            "after": after,
            "createdAt": now,
        }
    )
    _audit(event, "upload.edit", {"project": project_id, "id": upload_id})
    return response(200, db.strip_keys(item))


@router.route("GET", "/projects/{project_id}/files/download")
def download(event, project_id):
    _require_admin(event)
    key = (event.get("queryStringParameters") or {}).get("key", "")
    for u in db.query_all(f"PROJECT#{project_id}", "UPLOAD#"):
        for f in u.get("files", []):
            if f["key"] == key:
                return response(200, {"url": db.presign_download(key, f["name"])})
    raise HttpError(404, "Không tìm thấy file")


@router.route("GET", "/projects/{project_id}/export")
def export_project(event, project_id):
    """Dựng báo cáo .xlsx (gồm cả bản ghi đã ẩn), lưu S3 thư mục exports/ và trả link tải tạm."""
    _require_admin(event)
    _project_or_404(project_id)
    from admin_api.export import build_workbook, export_filename  # nạp muộn: thư viện nằm trong Lambda layer

    raw = (event.get("queryStringParameters") or {}).get("parties")
    party_types = None
    if raw is not None:
        party_types = [t for t in raw.split(",") if t]
        if not party_types or any(t not in PARTY_TYPES for t in party_types):
            raise HttpError(400, "Loại bên không hợp lệ")

    view = db.project_view(project_id)
    body = build_workbook(view, link_base=os.environ.get("WEB_BASE_URL"), party_types=party_types, catalog=db.get_scope_catalog())
    filename = export_filename(view["project"]["name"], datetime.now(VN))
    key = f"exports/{project_id}/{db.new_id()}.xlsx"
    db.s3().put_object(
        Bucket=db.bucket(), Key=key, Body=body,
        ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    _audit(event, "project.export", {"id": project_id})
    return response(200, {"url": db.presign_download(key, filename), "filename": filename})


def handler(event, context):
    return router.handle(event)

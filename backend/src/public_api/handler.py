"""Lambda cho Khách: chỉ đọc, chỉ trả dự án đang bật "Cho phép Khách xem"."""
from boto3.dynamodb.conditions import Key

from common import db
from common.http import HttpError, Router, response

router = Router("/public")


def _visible_project(project_id):
    item = db.get_project_item(project_id)
    # Dự án tắt trả 404 để Khách không biết dự án có tồn tại.
    if not item or not item.get("guestVisible"):
        raise HttpError(404, "Không tìm thấy dự án")
    return item


@router.route("GET", "/projects")
def list_projects(event):
    resp = db.table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq("VISIBILITY#public"),
        ScanIndexForward=False,
    )
    projects = [db.strip_keys(i) for i in resp["Items"]]
    return response(200, {"projects": projects})


@router.route("GET", "/projects/{project_id}")
def get_project(event, project_id):
    _visible_project(project_id)
    view = db.project_view(project_id)
    uploads = []
    for u in view["uploads"]:
        if u.get("hidden"):
            continue
        # Khách không được tải file: chỉ thấy tên, dung lượng, phiên bản; không lộ khóa S3.
        u["files"] = [{k: v for k, v in f.items() if k != "key"} for f in u.get("files", [])]
        uploads.append(u)
    view["uploads"] = uploads
    return response(200, view)


def handler(event, context):
    return router.handle(event)

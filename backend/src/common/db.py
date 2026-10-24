import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

_table = None
_s3 = None
_s3_presign = None


def table():
    global _table
    if _table is None:
        _table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
    return _table


def s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3")
    return _s3


def s3_presign():
    """Client dùng để ký URL. Khi chạy local, URL phải trỏ tới địa chỉ trình duyệt truy cập được."""
    global _s3_presign
    public = os.environ.get("S3_PUBLIC_ENDPOINT")
    if not public:
        return s3()
    if _s3_presign is None:
        _s3_presign = boto3.client("s3", endpoint_url=public)
    return _s3_presign


def bucket():
    return os.environ["FILES_BUCKET"]


def new_id():
    return uuid.uuid4().hex[:12]


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def query_all(pk, sk_prefix=None, **kwargs):
    cond = Key("PK").eq(pk)
    if sk_prefix:
        cond = cond & Key("SK").begins_with(sk_prefix)
    items = []
    resp = table().query(KeyConditionExpression=cond, **kwargs)
    items.extend(resp["Items"])
    while "LastEvaluatedKey" in resp:
        resp = table().query(KeyConditionExpression=cond, ExclusiveStartKey=resp["LastEvaluatedKey"], **kwargs)
        items.extend(resp["Items"])
    return items


def get_project_item(project_id):
    return table().get_item(Key={"PK": f"PROJECT#{project_id}", "SK": "META"}).get("Item")


def strip_keys(item):
    return {k: v for k, v in item.items() if k not in ("PK", "SK", "GSI1PK", "GSI1SK")}


def project_view(project_id):
    """Gom dự án + các bên + hạng mục + bản ghi đăng tải + ghi chú mới nhất."""
    items = query_all(f"PROJECT#{project_id}")
    out = {"project": None, "parties": [], "tasks": [], "uploads": [], "notes": []}
    for it in items:
        sk = it["SK"]
        if sk == "META":
            out["project"] = strip_keys(it)
        elif sk.startswith("PARTY#"):
            out["parties"].append(strip_keys(it))
        elif sk.startswith("TASK#"):
            out["tasks"].append(strip_keys(it))
        elif sk.startswith("UPLOAD#"):
            out["uploads"].append(strip_keys(it))
        elif sk.startswith("NOTE#"):
            out["notes"].append(strip_keys(it))
    out["uploads"].sort(key=lambda u: u["createdAt"], reverse=True)
    out["notes"].sort(key=lambda n: n["createdAt"], reverse=True)
    return out


def presign_download(key, filename, expires=300):
    return s3_presign().generate_presigned_url(
        "get_object",
        Params={
            "Bucket": bucket(),
            "Key": key,
            "ResponseContentDisposition": f"attachment; filename*=UTF-8''{_quote(filename)}",
        },
        ExpiresIn=expires,
    )


def _quote(s):
    from urllib.parse import quote

    return quote(s, safe="")

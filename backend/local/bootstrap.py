"""Tạo bảng DynamoDB và bucket S3 trên LocalStack (idempotent)."""
import os
import time

import boto3
from botocore.exceptions import ClientError

TABLE = os.environ["TABLE_NAME"]
BUCKET = os.environ["FILES_BUCKET"]


def wait_for_localstack():
    ddb = boto3.client("dynamodb")
    for _ in range(60):
        try:
            ddb.list_tables()
            return
        except Exception:
            time.sleep(1)
    raise SystemExit("LocalStack không phản hồi")


def ensure_table():
    ddb = boto3.client("dynamodb")
    try:
        ddb.describe_table(TableName=TABLE)
        return
    except ClientError:
        pass
    ddb.create_table(
        TableName=TABLE,
        BillingMode="PAY_PER_REQUEST",
        AttributeDefinitions=[{"AttributeName": n, "AttributeType": "S"} for n in ("PK", "SK", "GSI1PK", "GSI1SK")],
        KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}, {"AttributeName": "SK", "KeyType": "RANGE"}],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )


def ensure_bucket():
    s3 = boto3.client("s3")
    try:
        s3.head_bucket(Bucket=BUCKET)
    except ClientError:
        region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
        kwargs = {} if region == "us-east-1" else {"CreateBucketConfiguration": {"LocationConstraint": region}}
        s3.create_bucket(Bucket=BUCKET, **kwargs)
    # Trình duyệt tải từng phần thẳng lên S3: cần CORS và lộ header ETag.
    s3.put_bucket_cors(
        Bucket=BUCKET,
        CORSConfiguration={
            "CORSRules": [
                {
                    "AllowedOrigins": ["*"],
                    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
                    "AllowedHeaders": ["*"],
                    "ExposeHeaders": ["ETag"],
                }
            ]
        },
    )


if __name__ == "__main__":
    wait_for_localstack()
    ensure_table()
    ensure_bucket()
    print("Đã tạo bảng và bucket local", flush=True)

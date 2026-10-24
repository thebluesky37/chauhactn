# Chạy thử local và triển khai AWS

## 1. Test bằng Docker (trước khi lên AWS)

```bash
docker compose -f docker-compose.local.yml up -d --build
python3 backend/local/smoke_test.py      # kiểm tra end-to-end qua API
```

| Địa chỉ | Dịch vụ |
| --- | --- |
| http://localhost:5173 | Website (Vite dev, đăng nhập Admin bằng email + mật khẩu bất kỳ) |
| http://localhost:8000 | API giả lập API Gateway, gọi đúng mã Lambda thật |
| http://localhost:4566 | LocalStack: DynamoDB + S3 thật (có multipart upload) |

- Mã Lambda chạy y nguyên; chỉ khác phần đăng nhập (token cố định `dev-admin` thay cho Cognito) và endpoint AWS.
- Dữ liệu LocalStack mất khi xóa container. Dọn: `docker compose -f docker-compose.local.yml down -v`.
- Unit test không cần Docker: `pip install -r backend/requirements-dev.txt && pytest backend/tests`.
- Docker KHÔNG kiểm tra được: Cognito thật, API Gateway authorizer, IAM, CORS của API Gateway, Amplify, tên miền. Các phần này chỉ xác nhận được sau khi deploy (dùng môi trường thử, xem mục 2).

## 2. Deploy AWS

Chuẩn bị một lần:

1. Tạo S3 bucket chứa Terraform state (bật versioning), bỏ comment khối `backend "s3"` trong `infra/versions.tf`.
2. Tạo IAM OIDC provider cho GitHub và một role cho GitHub Actions; lưu vào GitHub repo: `vars.AWS_DEPLOY_ROLE_ARN`, `vars.ADMIN_EMAIL`, `vars.GH_REPOSITORY_URL`, `secrets.AMPLIFY_GITHUB_TOKEN`.
3. Đẩy mã lên GitHub.

Lần apply đầu (`enable_custom_domains=false`): chạy được bằng link mặc định của AWS, chưa cần tên miền.

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # sửa giá trị
export TF_VAR_github_access_token=...
terraform init && terraform apply
```

Đặt mật khẩu Admin: Cognito gửi mật khẩu tạm vào email; đặt mật khẩu chính thức bằng CLI:

```bash
aws cognito-idp admin-set-user-password --user-pool-id <id> --username <email> --password '<mật khẩu mạnh>' --permanent
```

## 3. Gắn tên miền hachauctn.id.vn (DNS giữ tại P.A Vietnam)

1. Đặt `enable_custom_domains=true`, chạy `terraform apply` (lần này sẽ dừng ở bước chờ chứng chỉ ACM).
2. Lấy `terraform output acm_validation_cname`, thêm bản ghi CNAME đó vào P.A Vietnam; ACM xác thực xong, chạy lại `terraform apply`.
3. Thêm CNAME `api` trỏ tới `terraform output api_custom_domain_target`.
4. Vào Amplify console, mục Domain management, lấy các CNAME của `www` (xác thực + trỏ về CloudFront) và nhập tại P.A Vietnam.
5. Tên miền gốc không có `www`: dùng redirect URL của P.A Vietnam sang `https://www.hachauctn.id.vn` (nếu P.A có ALIAS/ANAME thì dùng thay).

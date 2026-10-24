# Quản lý Dự án

Website quản lý dự án xây dựng: một tài khoản **Admin** tạo dự án, đăng tải file cập nhật và xuất báo cáo Excel; **Khách** không cần đăng nhập, chỉ xem (không tải file) các dự án Admin bật "Cho phép Khách xem".

Chạy trên AWS (serverless, chi phí thấp): Amplify (React) · API Gateway + Lambda Python · DynamoDB · S3 · Cognito, triển khai bằng Terraform.

| Thư mục | Nội dung |
| --- | --- |
| `Yêu cầu hệ thống Quản lý Dự án.md` | Yêu cầu và kiến trúc |
| `frontend/` | React + Vite + Tailwind |
| `backend/` | Lambda Python (`public_api`, `admin_api`), test, công cụ chạy local |
| `infra/` | Terraform |
| `docs/TRIEN_KHAI.md` | Chạy thử bằng Docker, deploy AWS, gắn tên miền |

Chạy thử local: `docker compose -f docker-compose.local.yml up -d --build` rồi mở http://localhost:5173.

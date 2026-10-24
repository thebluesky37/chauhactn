# Yêu cầu hệ thống Quản lý Dự án

Oct 22, 2026 · @Thanh

## 1. Mục tiêu và phạm vi

Xây dựng một trang web quản lý dự án xây dựng với một tài khoản Admin duy nhất: Admin tạo dự án, đăng tải toàn bộ file cập nhật và chọn file thuộc bên nào; Khách không cần đăng nhập, chỉ thấy các dự án Admin bật cho phép xem.

Trong phạm vi:

- Tạo và quản lý dự án, các bên tham gia và hạng mục công việc của thầu phụ.
- Admin đăng tải file cập nhật (Excel, Word, PDF, CAD, Revit) và gán cho Chủ đầu tư, Kiến trúc sư, Phối hợp kiến trúc hoặc Thầu phụ; lưu đầy đủ lịch sử.
- Bật / tắt cho phép Khách xem theo từng dự án.
- Ghi chú cho dự án; xuất toàn bộ thông tin dự án ra file Excel.

Ngoài phạm vi (giai đoạn đầu): tài khoản cho người dùng khác ngoài Admin, các bên tự tải file lên, xem trực tiếp bản vẽ CAD/Revit trên web, ứng dụng di động riêng.

## 2. Vai trò người dùng và quyền xem

Hệ thống chỉ có một tài khoản đăng nhập là Admin; mọi người khác là Khách, vào trang web không cần đăng nhập và chỉ xem được.

| Vai trò | Đăng nhập | Xem dự án | Đăng tải file | Quản lý |
| --- | --- | --- | --- | --- |
| Admin (1 tài khoản duy nhất) | Có | Tất cả dự án | Có, chọn file thuộc bên nào | Tạo, sửa, đóng dự án; nhập các bên tham gia; bật / tắt cho phép Khách xem |
| Khách | Không | Chỉ dự án được Admin cho phép | Không | Không |

Quy tắc quyền xem:

- Mỗi dự án có một nút "Cho phép Khách xem" (mặc định tắt khi tạo dự án).
- Dự án đang tắt: Khách không thấy trong danh sách và không mở được, kể cả khi có đường dẫn.
- Admin tắt lại bất cứ lúc nào; dự án và file của dự án biến mất ngay khỏi trang Khách.
- Chủ đầu tư, Kiến trúc sư, Phối hợp kiến trúc, Thầu phụ là dữ liệu của dự án (tên, liên hệ), không phải tài khoản.

## 3. Thông tin dự án và các bên tham gia

Một dự án gồm thông tin chung, bốn nhóm bên tham gia và phần ghi chú.

### 3.1 Thông tin chung

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Tên dự án | Có |  |
| Ngày khởi tạo | Có | Mặc định là ngày tạo, có thể sửa |
| Ngày hoàn thành (dự kiến) | Có | Không được trước ngày khởi tạo |
| Ngày hoàn thành thực tế | Không | Nhập khi đóng dự án |
| Trạng thái | Có | Đang thực hiện / Tạm dừng / Hoàn thành |
| Cho phép Khách xem | Có | Bật / tắt, mặc định tắt |
| Ghi chú | Không | Văn bản tự do, xem mục 3.6 |

### 3.2 Thầu phụ

Một dự án có thể có nhiều thầu phụ; mỗi thầu phụ có thể thực hiện nhiều hạng mục công việc.

- Tên thầu phụ (kèm thông tin liên hệ: người đại diện, điện thoại, email).
- Danh sách công việc thực hiện, mỗi công việc gồm:
  - Tên / mô tả công việc
  - Ngày bắt đầu
  - Ngày kết thúc
  - Thông tin cập nhật: các file tiến độ thầu phụ gửi hằng ngày hoặc theo định kỳ, do Admin đăng tải lên (xem mục 4).

### 3.3 Chủ đầu tư

- Tên chủ đầu tư (kèm thông tin liên hệ).
- File cập nhật của chủ đầu tư do Admin đăng tải (xem mục 4).

### 3.4 Kiến trúc sư

- Tên kiến trúc sư / đơn vị kiến trúc (kèm thông tin liên hệ).
- File cập nhật của kiến trúc sư do Admin đăng tải.

### 3.5 Phối hợp kiến trúc

- Tên đơn vị / người phối hợp kiến trúc (kèm thông tin liên hệ).
- File cập nhật do Admin đăng tải; khi đăng, Admin chọn file này gửi cho Kiến trúc sư và/hoặc Thầu phụ nào.

### 3.6 Ghi chú

- Ô ghi chú chung cho dự án, Admin chỉnh sửa được.
- Mỗi lần sửa ghi chú được lưu thời điểm sửa.

## 4. Đăng tải file cập nhật và lịch sử

Chỉ Admin đăng tải file; mỗi lần đăng, Admin chọn file thuộc bên nào, và mỗi lần đăng được lưu thành một bản ghi riêng, không ghi đè.

### 4.1 Định dạng file hỗ trợ

| Loại | Đuôi file |
| --- | --- |
| Excel | .xls, .xlsx, .csv |
| Word | .doc, .docx |
| PDF | .pdf |
| CAD | .dwg, .dxf |
| Revit | .rvt, .rfa |
| Ảnh hiện trường (đề xuất thêm) | .jpg, .png |

### 4.2 Các bước đăng tải

1. Chọn dự án.
2. Chọn file thuộc bên nào: Chủ đầu tư / Kiến trúc sư / Phối hợp kiến trúc / Thầu phụ, rồi chọn tên cụ thể trong danh sách các bên của dự án.
3. Nhập thông tin bổ sung theo bên đã chọn:
   - Thầu phụ: chọn hạng mục công việc (bắt buộc).
   - Phối hợp kiến trúc: chọn bên nhận là Kiến trúc sư và/hoặc Thầu phụ nào (bắt buộc).
4. Nhập ngày bên đó gửi file (mặc định hôm nay) và kỳ báo cáo: theo ngày hoặc khoảng thời gian (từ ngày – đến ngày).
5. Nhập mô tả / nội dung cập nhật (văn bản ngắn) và ghi chú thêm của Admin nếu cần (không bắt buộc, sửa được sau khi đăng). Ghi chú hiển thị cùng bản ghi trong lịch sử, Khách cũng xem được.
6. Chọn một hoặc nhiều file và bấm Đăng tải. Hệ thống tự lưu thời điểm đăng.

### 4.3 Lịch sử

- Danh sách các lần đăng, mới nhất ở trên, lọc được theo: bên gửi, tên bên, hạng mục, khoảng thời gian, loại file.
- Mỗi bản ghi xem lại được đầy đủ thông tin; chỉ Admin tải được file gốc, Khách chỉ thấy tên file, dung lượng và phiên bản.
- Đăng lại file cùng tên cho cùng bên / hạng mục thì lưu thành phiên bản mới (v1, v2, …), vẫn giữ các phiên bản cũ.
- Admin sửa được thông tin bản ghi (ví dụ chọn nhầm bên); hệ thống lưu lại nội dung trước và sau khi sửa.
- Bản ghi không bị xóa vĩnh viễn; Admin chỉ có thể ẩn bản ghi sai.

### 4.4 Xuất dự án ra file Excel

Chỉ Admin được xuất file: trong phần quản trị, trang chi tiết dự án có nút "Xuất Excel" (Khách không thấy nút này), tải về một file .xlsx. Tên file xuất: `<Tên dự án>_<ngày xuất>.xlsx`.

Toàn bộ thông tin nằm trên **một tab duy nhất** ("Báo cáo dự án"), trình bày như một báo cáo, từ trên xuống dưới:

| Khối | Nội dung | Định dạng |
| --- | --- | --- |
| Tiêu đề | Tên dự án, thời điểm xuất | Dải màu xanh đậm, chữ trắng |
| Chỉ số tổng quan | Số bên, số hạng mục, số lần đăng tải, số file, thời điểm cập nhật gần nhất | Thẻ số liệu |
| 1. Thông tin chung | Tên dự án, trạng thái, ngày khởi tạo, ngày hoàn thành dự kiến / thực tế, cho phép Khách xem | Bảng nhãn – giá trị |
| 2. Ghi chú | Ghi chú mới nhất và thời điểm sửa | Ô gộp, tự xuống dòng |
| 3. Các bên tham gia | Loại bên, tên, người đại diện, điện thoại, email | Excel Table (có lọc, sắp xếp) |
| 4. Hạng mục thầu phụ | Thầu phụ, công việc, cập nhật gần nhất, bắt đầu, kết thúc, số lần cập nhật | Excel Table |
| 5. Lịch sử đăng tải | Loại bên, tên bên, hạng mục, ngày gửi, kỳ báo cáo, bên nhận, mô tả, ghi chú Admin, tên file, loại, dung lượng, phiên bản, đăng tải lúc, trạng thái (Hiện / Đã ẩn) | Excel Table |

- Lịch sử đăng tải xếp mới nhất ở trên; một lần đăng nhiều file thì mỗi file một dòng, cùng thông tin lần đăng. Ngày là kiểu ngày thật của Excel (lọc, sắp xếp được), múi giờ UTC+7.
- Trình bày: ẩn đường lưới, khối tiêu đề cố định khi cuộn, màu và cỡ chữ thống nhất, sẵn sàng in (khổ A3 ngang, vừa 1 trang theo chiều ngang, có số trang ở chân trang).
- Bảng không có dữ liệu thì hiện dòng "Chưa có dữ liệu".
- File Excel không đính kèm bản thân file; cột Tên file là link bấm được dạng `https://www.hachauctn.id.vn/download?p=<dự án>&k=<khóa file>`. Link không hết hạn: mở trang tải, bắt Admin đăng nhập (nếu chưa), rồi cấp link tải tạm 5 phút. Người không phải Admin có link vẫn không tải được.
- Admin xuất được cả bản ghi đã ẩn (cột Trạng thái: Hiện / Đã ẩn).
- Kỹ thuật: Lambda `admin-api` dựng file bằng XlsxWriter (đóng gói trong Lambda layer), lưu `exports/` trên S3 (tự xóa sau 1 ngày) và trả link tải hết hạn sau 5 phút.

## 5. Luồng gửi file giữa các bên

&#91;embedded content: luồng gửi file · 4 bên gửi, 1 kho dự án\]

Các bên gửi file cho Admin qua kênh ngoài (email, Zalo…); Admin đăng tải lên và chọn file thuộc Chủ đầu tư, Kiến trúc sư, Phối hợp kiến trúc hay Thầu phụ. Với file của Phối hợp kiến trúc, Admin chọn thêm bên nhận (Kiến trúc sư và/hoặc Thầu phụ). Khách không cần đăng nhập, chỉ xem được file của các dự án Admin cho phép.

## 6. Chức năng theo màn hình

Trang web chia hai phần: phần Khách (không đăng nhập, chỉ xem) và phần Admin (sau khi đăng nhập).

| Màn hình | Ai dùng | Chức năng chính |
| --- | --- | --- |
| Danh sách dự án (trang chủ) | Khách | Chỉ hiện dự án được cho phép xem; tìm kiếm, lọc theo trạng thái |
| Chi tiết dự án | Khách | Thông tin chung, các bên, hạng mục và tiến độ, ghi chú, file mới nhất của từng bên |
| Lịch sử cập nhật | Khách | Danh sách các lần đăng, bộ lọc, xem chi tiết, xem các phiên bản (không tải file) |
| Đăng nhập Admin | Admin | Đăng nhập bằng email + mật khẩu, đổi mật khẩu |
| Quản lý dự án | Admin | Xem mọi dự án; tạo / sửa / đóng dự án; nhập các bên, hạng mục; bật / tắt cho phép Khách xem |
| Đăng tải file | Admin | Chọn bên gửi, hạng mục / bên nhận, ngày gửi, kỳ báo cáo, mô tả, ghi chú (không bắt buộc), file (mục 4.2) |
| Lịch sử (Admin) | Admin | Như của Khách, thêm sửa thông tin bản ghi và ẩn bản ghi sai |
| Xuất Excel (nút trên trang chi tiết dự án) | Chỉ Admin | Tải file .xlsx gồm thông tin chung, các bên, hạng mục, lịch sử đăng tải và tên file (mục 4.4) |

Đề xuất thêm cho trang chi tiết dự án: biểu đồ Gantt đơn giản các hạng mục của thầu phụ theo ngày bắt đầu – kết thúc, và đánh dấu hạng mục lâu chưa có file cập nhật.

## 7. Yêu cầu phi chức năng

- Bảo mật: dự án đang tắt cho phép xem thì Khách không mở được trang lẫn file, kể cả có đường dẫn; trang quản trị chỉ vào được sau khi Admin đăng nhập.
- Lưu ý: Khách không đăng nhập nên bất kỳ ai có địa chỉ trang web đều xem được các dự án đang bật; không bật cho dự án có tài liệu nhạy cảm.
- Dung lượng: hỗ trợ file lớn (file CAD/Revit thường vài chục đến vài trăm MB); giới hạn cụ thể cần xác nhận.
- Lưu trữ: file lưu trên Amazon S3 (riêng tư, không công khai), có sao lưu định kỳ (xem mục 9.6).
- Nhật ký hệ thống: ghi lại đăng nhập Admin, bật / tắt cho phép xem, đăng tải và sửa file.
- Giao diện: tiếng Việt, dùng được trên máy tính và điện thoại, thiết kế như một website chuyên nghiệp (xem mục 10).
- Hiệu năng: trang danh sách và lịch sử tải dưới 3 giây với vài nghìn bản ghi.
- Chi phí: toàn bộ hệ thống chạy trên AWS, ưu tiên chi phí thấp nhất, mô hình serverless trả theo mức dùng (xem mục 9.7).

## 8. Các điểm cần xác nhận

- [x] Khách có được tải file về không? Đã chốt: **Khách không được tải file**, chỉ xem danh sách và thông tin (tên file, loại, dung lượng, phiên bản). Chỉ Admin tải file.
- [ ] Khách thấy toàn bộ file của dự án được cho phép, hay Admin cần ẩn riêng một số file / một số bên?
- [ ] Có cần thêm một lớp bảo vệ nhẹ cho Khách (ví dụ mật khẩu chung cho từng dự án) không?
- [ ] Có cần nhắc Admin khi một thầu phụ lâu chưa có file cập nhật (ví dụ quá 3 ngày) không?
- [ ] Giới hạn dung lượng mỗi file và tổng dung lượng mỗi dự án?
- [ ] Có cần % hoàn thành cho từng hạng mục công việc không?
- [ ] Chọn tên miền con cho website và API (đề xuất: `www.hachauctn.id.vn` và `api.hachauctn.id.vn`, xem mục 9.5)?
- [ ] Chọn vùng AWS (đề xuất: `ap-southeast-1` Singapore, gần Việt Nam nhất)?
- [ ] Repo GitHub là public hay private, tài khoản / tổ chức GitHub nào?

## 9. Kiến trúc kỹ thuật (AWS, chi phí thấp nhất)

Nguyên tắc: serverless hoàn toàn, không có máy chủ chạy 24/7, không dùng dịch vụ có phí cố định hằng tháng (RDS, NAT Gateway, WAF, OpenSearch, Route 53...). Chỉ trả tiền theo mức dùng thực tế; với quy mô một Admin và lượng khách xem nhỏ, phần lớn nằm trong hạn mức miễn phí.

### 9.1 Sơ đồ tổng quan

```text
                    Người dùng (Khách / Admin)
                               |
          +--------------------+--------------------+
          |                                         |
   www.hachauctn.id.vn                      api.hachauctn.id.vn
   AWS Amplify Hosting                      API Gateway (HTTP API)
   (React SPA, CDN)                         + Custom domain (ACM)
          |                                         |
          |                          +--------------+--------------+
          |                          |                             |
          |                  /public/* (không đăng nhập)   /admin/* (JWT Cognito)
          |                  Lambda Python: public-api     Lambda Python: admin-api
          |                          |                             |
          |                          +------+-----------+----------+
          |                                 |           |
          |                           DynamoDB      S3 (private)
          |                           (1 bảng)      file dự án, file xuất Excel
          |                                              ^
          +--- tải / xem file bằng presigned URL --------+
               (hết hạn sau vài phút, chỉ cấp khi được phép)

   Amazon Cognito User Pool: 1 tài khoản Admin (tắt tự đăng ký)
   CloudWatch Logs: nhật ký Lambda, giữ 14 ngày
```

### 9.2 Lựa chọn dịch vụ

| Thành phần | Dịch vụ AWS | Lý do chọn (chi phí thấp nhất) |
| --- | --- | --- |
| Frontend | AWS Amplify Hosting | Yêu cầu của dự án; tự build và deploy mỗi lần push GitHub, có CDN và HTTPS miễn phí, chi phí vài cent mỗi tháng |
| API | API Gateway HTTP API | Rẻ hơn REST API khoảng 70%; có JWT authorizer sẵn cho Cognito; có throttling chống lạm dụng |
| Xử lý | Lambda Python 3.12, kiến trúc arm64 (Graviton) | Rẻ hơn x86 khoảng 20%; không tốn tiền khi không có người dùng |
| Cơ sở dữ liệu | DynamoDB chế độ on-demand | Không có phí cố định; hàng nghìn bản ghi chỉ tốn vài cent; không cần VPC nên không phát sinh NAT Gateway |
| Lưu file | S3 Standard, chặn hoàn toàn truy cập công khai | Giá lưu trữ thấp; hỗ trợ file hàng trăm MB bằng multipart upload |
| Đăng nhập Admin | Cognito User Pool | Miễn phí đến 10.000 người dùng hoạt động; không phải tự viết và bảo trì phần mật khẩu |
| Chứng chỉ HTTPS | ACM (cho API) và chứng chỉ do Amplify quản lý (cho web) | Miễn phí |
| Hạ tầng dưới dạng mã | Terraform | Yêu cầu của dự án |
| CI/CD | GitHub + Amplify (frontend) + GitHub Actions (Terraform và Lambda) | Miễn phí với repo public; repo private nằm trong hạn mức miễn phí của GitHub |

Các lựa chọn đã cân nhắc và loại bỏ:

- RDS / Aurora: có phí cố định hằng tháng; dữ liệu của hệ thống dạng bản ghi theo dự án, DynamoDB đủ dùng.
- Route 53: tốn 0,5 USD mỗi tháng cho mỗi vùng; thay bằng giữ DNS tại P.A Vietnam (xem mục 9.5).
- CloudFront riêng cho S3: chưa cần; tải file bằng presigned URL trực tiếp từ S3. Có thể thêm sau nếu lượng tải lớn.
- AWS WAF: tốn phí cố định; thay bằng throttling của API Gateway và Cognito.
- Lambda đặt trong VPC: không cần, tránh phí NAT Gateway.

### 9.3 Backend: Lambda Python

- Ngôn ngữ: Python 3.12 (arm64). Thư viện: AWS Lambda Powertools for Python (định tuyến, kiểm tra dữ liệu, ghi log), boto3, XlsxWriter (xuất Excel).
- Hai hàm tách quyền hạn (nguyên tắc quyền tối thiểu):
  - `public-api`: chỉ đọc. Trả về dự án có `guestVisible = true`; mọi truy vấn đều kiểm tra cờ này, dự án tắt trả về 404 để Khách không biết dự án có tồn tại. Không có endpoint tải file và không trả khóa S3 cho Khách; hàm này cũng không có quyền đọc S3 (IAM).
  - `admin-api`: đọc và ghi. Chỉ chạy khi có JWT hợp lệ của Cognito (kiểm tra ở API Gateway, và kiểm tra lại nhóm `admin` trong hàm). Gồm: quản lý dự án, các bên, hạng mục, ghi chú, bật / tắt cho Khách xem, đăng tải file, sửa và ẩn bản ghi, xuất Excel, ghi nhật ký.
- Xuất Excel: hàm `admin-api` dựng file .xlsx một tab theo mục 4.4, lưu vào S3 (thư mục `exports/`, tự xóa sau 1 ngày bằng lifecycle), trả presigned URL. Bản ghi đã ẩn có cột Trạng thái.
- Đăng tải file lớn (CAD / Revit vài trăm MB): trình duyệt tải thẳng lên S3 bằng presigned multipart upload, không đi qua Lambda (giới hạn 6 MB của Lambda). Luồng: (1) frontend gọi `POST /admin/projects/{id}/files/init` để lấy upload ID và các presigned URL của từng phần; (2) tải từng phần song song lên S3; (3) gọi `POST /admin/projects/{id}/files/complete`; (4) gọi `POST /admin/projects/{id}/uploads`, Lambda xác nhận file đã có trên S3 rồi mới ghi bản ghi vào DynamoDB.
- Phiên bản file (v1, v2...): Lambda tìm bản mới nhất theo khóa `bên + hạng mục + tên file`, cộng 1 vào số phiên bản. Bản ghi chỉ ẩn, không xóa; S3 bật versioning để không mất file.

### 9.4 Cơ sở dữ liệu: DynamoDB một bảng

Một bảng `pm-main` (khóa `PK`, `SK`) cùng một chỉ mục phụ `GSI1`:

| Thực thể | PK | SK | Ghi chú |
| --- | --- | --- | --- |
| Dự án | `PROJECT#<id>` | `META` | Thông tin chung, `guestVisible`, trạng thái |
| Bên tham gia | `PROJECT#<id>` | `PARTY#<partyId>` | Loại bên, tên, liên hệ |
| Hạng mục thầu phụ | `PROJECT#<id>` | `TASK#<taskId>` | Công việc, ngày bắt đầu / kết thúc |
| Ghi chú (lịch sử sửa) | `PROJECT#<id>` | `NOTE#<thời điểm>` | Mỗi lần sửa một dòng |
| Bản ghi đăng tải | `PROJECT#<id>` | `UPLOAD#<thời điểm>#<id>` | Mới nhất ở trên khi đọc ngược; chứa danh sách file, S3 key, phiên bản, cờ `hidden` |
| Lịch sử sửa bản ghi | `UPLOAD#<id>` | `REV#<thời điểm>` | Nội dung trước và sau khi sửa |
| Nhật ký hệ thống | `AUDIT#<ngày>` | `<thời điểm>#<id>` | Đăng nhập, bật / tắt, đăng tải, sửa |

- `GSI1` (`GSI1PK = VISIBILITY#public`, `GSI1SK = <ngày tạo>`): liệt kê nhanh các dự án Khách được xem.
- Lọc lịch sử theo bên, hạng mục, loại file, khoảng thời gian: truy vấn theo dự án rồi lọc ở Lambda; vài nghìn bản ghi vẫn dưới 3 giây.
- Bật point-in-time recovery (khôi phục theo thời điểm) cho bảng.

### 9.5 Tên miền hachauctn.id.vn (đăng ký tại P.A Vietnam)

Giữ DNS tại P.A Vietnam, chỉ thêm bản ghi CNAME, không chuyển sang Route 53 để tiết kiệm phí.

| Tên | Loại | Trỏ tới | Mục đích |
| --- | --- | --- | --- |
| `www` | CNAME | Tên miền do Amplify cấp (`main.xxxx.amplifyapp.com`) | Website |
| `_xxxx.www` | CNAME | Giá trị Amplify yêu cầu | Xác thực chứng chỉ HTTPS của web |
| `api` | CNAME | Tên miền đích của API Gateway custom domain | API |
| `_yyyy.api` | CNAME | Giá trị ACM yêu cầu | Xác thực chứng chỉ HTTPS của API |

- Tên miền gốc `hachauctn.id.vn` (không có `www`): cần bản ghi ALIAS / ANAME hoặc chuyển hướng URL. Cần kiểm tra trang quản lý DNS của P.A Vietnam có hỗ trợ không; nếu không, dùng tính năng chuyển hướng (redirect) của P.A từ tên miền gốc sang `www`.
- Các giá trị CNAME xác thực chỉ biết sau khi Terraform tạo tài nguyên; sau lần `terraform apply` đầu tiên, nhập thủ công vào P.A Vietnam một lần (lấy từ `terraform output`).
- Chứng chỉ ACM cho API Gateway tạo cùng vùng với API (ví dụ `ap-southeast-1`); chứng chỉ của web do Amplify tự quản lý và tự gia hạn.

### 9.6 Bảo mật, sao lưu, vận hành

- S3: bật Block Public Access, mã hóa mặc định (SSE-S3), bật versioning, CORS chỉ cho phép `https://www.hachauctn.id.vn`.
- Chỉ Admin tải được file, bằng presigned URL hết hạn sau 5 phút. Khách không có đường tải file nào.
- Cognito: tắt tự đăng ký, tạo sẵn một tài khoản Admin, mật khẩu mạnh, có thể bật MFA (TOTP, miễn phí). Lambda dùng IAM role riêng cho từng hàm, chỉ cấp đúng quyền cần.
- Chống lạm dụng: throttling của API Gateway (ví dụ 20 yêu cầu / giây, burst 40) cho `/public/*` và giới hạn thấp hơn cho `/admin/*`.
- Sao lưu: DynamoDB point-in-time recovery; S3 versioning cùng lifecycle chuyển phiên bản cũ sang S3 Standard-IA sau 30 ngày; lifecycle xóa các phần upload dang dở sau 7 ngày.
- Nhật ký: CloudWatch Logs giữ 14 ngày; ngân sách AWS Budgets đặt ngưỡng cảnh báo (ví dụ 10 USD / tháng) gửi email, miễn phí.
- Trạng thái Terraform: lưu trong một S3 bucket riêng (bật versioning, dùng khóa `use_lockfile` của Terraform, không cần bảng DynamoDB khóa).

### 9.7 Ước tính chi phí hằng tháng

Giả định: 1 Admin, vài trăm lượt Khách xem mỗi tháng, 50 GB file lưu trữ, vài trăm yêu cầu API mỗi ngày.

| Hạng mục | Ước tính (USD / tháng) |
| --- | --- |
| S3 lưu 50 GB | ~1,2 |
| S3 truyền dữ liệu ra (vài GB) | ~0,1 – 0,5 |
| Lambda, API Gateway HTTP API | 0 – 0,1 (nằm trong hạn mức miễn phí hoặc vài cent) |
| DynamoDB on-demand + PITR | ~0,1 – 0,3 |
| Cognito (1 người dùng) | 0 |
| Amplify Hosting (build + lưu + truyền tải) | ~0 – 1 |
| ACM, CloudWatch Logs (giữ 14 ngày), AWS Budgets | 0 – 0,3 |
| Tên miền (phí hằng năm tại P.A Vietnam, đã mua) | ngoài AWS |
| Tổng | khoảng 2 – 4 USD, tăng chủ yếu theo dung lượng S3 |

Con số là ước tính, cần kiểm tra lại bằng AWS Pricing Calculator khi có số liệu thực tế. Một số hạn mức miễn phí của AWS chỉ áp dụng 12 tháng đầu hoặc khác nhau theo loại tài khoản.

### 9.8 Mã nguồn, GitHub và triển khai bằng Terraform

Một repo (monorepo) trên GitHub:

```text
quan-ly-du-an/
├── frontend/                 # React + Vite + TypeScript
├── backend/
│   ├── src/
│   │   ├── public_api/       # Lambda cho Khách
│   │   ├── admin_api/        # Lambda cho Admin
│   │   └── common/           # mô hình dữ liệu, truy cập DynamoDB / S3, kiểm tra quyền
│   ├── tests/                # pytest
│   └── requirements.txt
├── infra/                    # Terraform
│   ├── main.tf  providers.tf  variables.tf  outputs.tf
│   └── modules/              # s3, dynamodb, cognito, lambda, apigw, amplify
├── .github/workflows/        # CI/CD
└── docs/                     # tài liệu, gồm file yêu cầu này
```

- Terraform tạo toàn bộ: S3, DynamoDB, Cognito, Lambda + IAM, API Gateway + custom domain + ACM, Amplify app + branch + custom domain, CloudWatch, Budgets. Đóng gói Lambda bằng `archive_file` (hoặc bước build trong CI).
- Frontend: Amplify kết nối repo GitHub (nhánh `main`), mỗi lần push tự build và deploy. Biến môi trường (`VITE_API_URL`, mã Cognito) do Terraform truyền vào Amplify.
- Backend và hạ tầng: GitHub Actions chạy `pytest` rồi `terraform plan` khi mở Pull Request, `terraform apply` khi gộp vào `main`. GitHub Actions đăng nhập AWS bằng OIDC (vai trò tạm thời), không lưu khóa truy cập lâu dài trong GitHub.
- Hai môi trường: `dev` (tùy chọn, có thể tắt để tiết kiệm) và `prod`, dùng chung module, khác biến.

## 10. Thiết kế giao diện (UI/UX)

Mục tiêu: giao diện như một website chuyên nghiệp: sạch, đáng tin cậy, dễ quét thông tin, dùng tốt trên điện thoại.

### 10.1 Công nghệ giao diện

- React 18 + TypeScript + Vite (ứng dụng một trang, xuất tĩnh để Amplify phục vụ qua CDN, không tốn chi phí máy chủ).
- Tailwind CSS + shadcn/ui (thành phần dựng sẵn, dễ truy cập bàn phím và trình đọc màn hình).
- TanStack Query (gọi API, lưu đệm), React Router, React Hook Form + Zod (biểu mẫu và kiểm tra dữ liệu), Lucide (biểu tượng), Recharts hoặc thư viện Gantt nhẹ (biểu đồ).
- Phông chữ Be Vietnam Pro hoặc Inter (hỗ trợ đầy đủ dấu tiếng Việt).

### 10.2 Phong cách thị giác

- Tông màu: xanh dương đậm làm màu chủ đạo (tin cậy, hợp ngành xây dựng), màu nhấn cam cho hành động chính và cảnh báo; nền trắng và xám nhạt.
- Màu trạng thái dự án cố định và nhất quán: Đang thực hiện (xanh dương), Tạm dừng (vàng), Hoàn thành (xanh lá); hạng mục lâu chưa cập nhật (cam / đỏ).
- Bo góc vừa phải, đổ bóng nhẹ, khoảng trắng rộng rãi, lưới 8 px; chữ nội dung tối thiểu 14 – 16 px.
- Có chế độ tối (dark mode) theo cài đặt hệ thống; độ tương phản đạt WCAG AA.
- Biểu tượng riêng cho từng loại file (Excel, Word, PDF, CAD, Revit, ảnh) và nhãn màu riêng cho 4 bên (Chủ đầu tư, Kiến trúc sư, Phối hợp kiến trúc, Thầu phụ).

### 10.3 Bố cục từng khu vực

| Màn hình | Thiết kế |
| --- | --- |
| Trang chủ (Khách) | Thanh đầu trang có logo và tên hệ thống; khối giới thiệu ngắn; ô tìm kiếm lớn; bộ lọc trạng thái dạng chip; lưới thẻ dự án (tên, trạng thái, ngày, tiến độ, lần cập nhật gần nhất) |
| Chi tiết dự án | Đầu trang có tên, trạng thái, các mốc ngày; thẻ tóm tắt số liệu (số bên, số hạng mục, số lần cập nhật, cập nhật gần nhất); các tab: Tổng quan, Các bên, Hạng mục và Gantt, Lịch sử cập nhật, Ghi chú; trên điện thoại tab cuộn ngang |
| Lịch sử cập nhật | Dạng dòng thời gian hoặc bảng; thanh lọc cố định phía trên (bên, hạng mục, loại file, khoảng ngày); mở rộng từng dòng để xem mô tả, ghi chú và các phiên bản; nút tải file chỉ hiện với Admin |
| Đăng nhập Admin | Trang đơn giản, một thẻ ở giữa, thông báo lỗi rõ ràng |
| Khu quản trị | Thanh bên trái (thu gọn được trên điện thoại): Dự án, Đăng tải, Lịch sử, Nhật ký; bảng dự án có công tắc "Cho phép Khách xem" ngay trên từng dòng, có xác nhận khi tắt |
| Đăng tải file | Biểu mẫu từng bước (chọn bên, thông tin bổ sung, kỳ báo cáo, file); vùng kéo thả nhiều file, thanh tiến trình từng file, tiếp tục tải khi lỗi mạng; kiểm tra định dạng và dung lượng trước khi tải |

### 10.4 Nguyên tắc trải nghiệm

- Trạng thái đầy đủ: khung xương (skeleton) khi đang tải, thông báo khi danh sách trống có hướng dẫn hành động, thông báo lỗi dễ hiểu bằng tiếng Việt, toast xác nhận sau mỗi thao tác.
- Hành động nguy hiểm (tắt cho Khách xem, ẩn bản ghi) có hộp thoại xác nhận nêu rõ hậu quả.
- Thiết kế ưu tiên điện thoại (mobile-first); bảng chuyển thành danh sách thẻ ở màn hình nhỏ; vùng bấm tối thiểu 44 px.
- Điều hướng bàn phím, nhãn cho trình đọc màn hình, thứ tự tab hợp lý.
- Hiệu năng: tách mã theo trang, tải chậm hình ảnh, phân trang hoặc cuộn vô hạn cho lịch sử; mục tiêu Lighthouse từ 90 điểm trở lên.
- Ngày giờ hiển thị `dd/MM/yyyy`, múi giờ Việt Nam (UTC+7); dung lượng file hiển thị dạng KB / MB / GB.
- Tiêu đề trang, mô tả và biểu tượng trình duyệt (favicon) đặt đúng để website trông hoàn chỉnh khi chia sẻ.

### 10.5 Các bước thực hiện đề xuất

1. Dựng khung repo, Terraform nền (S3, DynamoDB, Cognito) và pipeline GitHub Actions.
2. Backend: dự án, các bên, hạng mục, quyền Khách xem; kiểm thử bằng pytest.
3. Đăng tải file (multipart), lịch sử, phiên bản, sửa và ẩn bản ghi, nhật ký.
4. Xuất Excel.
5. Frontend: khu Khách, rồi khu Admin; kết nối Amplify và tên miền.
6. Gantt, cảnh báo hạng mục lâu chưa cập nhật, kiểm thử tải, hoàn thiện giao diện.

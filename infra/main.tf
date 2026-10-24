locals {
  name       = "pm"
  web_origin = var.enable_custom_domains ? "https://${var.web_subdomain}.${var.domain}" : var.web_url_default
  api_domain = "${var.api_subdomain}.${var.domain}"
}

data "aws_caller_identity" "me" {}

# ---------- S3: file dự án ----------
resource "aws_s3_bucket" "files" {
  bucket = "${local.name}-files-${data.aws_caller_identity.me.account_id}"
}

resource "aws_s3_bucket_public_access_block" "files" {
  bucket                  = aws_s3_bucket.files.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  cors_rule {
    allowed_origins = [local.web_origin, "http://localhost:5173"]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "files" {
  bucket     = aws_s3_bucket.files.id
  depends_on = [aws_s3_bucket_versioning.files]

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload { days_after_initiation = 7 }
  }

  rule {
    id     = "expire-exports"
    status = "Enabled"
    filter { prefix = "exports/" }
    expiration { days = 1 }
    noncurrent_version_expiration { noncurrent_days = 1 }
  }

  rule {
    id     = "old-versions-to-ia"
    status = "Enabled"
    filter {}
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

# ---------- DynamoDB ----------
resource "aws_dynamodb_table" "main" {
  name         = "${local.name}-main"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  deletion_protection_enabled = true
}

# ---------- Cognito: 1 tài khoản Admin ----------
resource "aws_cognito_user_pool" "admin" {
  name                     = "${local.name}-admin"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OPTIONAL"

  admin_create_user_config { allow_admin_create_user_only = true }

  software_token_mfa_configuration { enabled = true }

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name            = "${local.name}-web"
  user_pool_id    = aws_cognito_user_pool.admin.id
  generate_secret = false

  explicit_auth_flows           = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.admin.id
}

resource "aws_cognito_user" "admin" {
  user_pool_id = aws_cognito_user_pool.admin.id
  username     = var.admin_email
  attributes = {
    email          = var.admin_email
    email_verified = "true"
  }
  # Cognito gửi mật khẩu tạm qua email; lần đăng nhập đầu cần đặt mật khẩu mới (xem README).
}

resource "aws_cognito_user_in_group" "admin" {
  user_pool_id = aws_cognito_user_pool.admin.id
  group_name   = aws_cognito_user_group.admin.name
  username     = aws_cognito_user.admin.username
}

# ---------- Lambda ----------
data "archive_file" "backend" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/src"
  output_path = "${path.module}/.build/backend.zip"
  excludes    = ["**/__pycache__/**", "**/*.pyc"]
}

resource "aws_cloudwatch_log_group" "public" {
  name              = "/aws/lambda/${local.name}-public-api"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "admin" {
  name              = "/aws/lambda/${local.name}-admin-api"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# public-api: chỉ đọc DynamoDB, KHÔNG có quyền S3 (Khách không tải file).
resource "aws_iam_role" "public" {
  name               = "${local.name}-public-api"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy" "public" {
  role = aws_iam_role.public.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:Query"]
        Resource = [aws_dynamodb_table.main.arn, "${aws_dynamodb_table.main.arn}/index/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.public.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role" "admin" {
  name               = "${local.name}-admin-api"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy" "admin" {
  role = aws_iam_role.admin.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = [aws_dynamodb_table.main.arn, "${aws_dynamodb_table.main.arn}/index/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject", "s3:PutObject", "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"
        ]
        Resource = "${aws_s3_bucket.files.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.admin.arn}:*"
      }
    ]
  })
}

# Layer chứa XlsxWriter (thư viện thuần Python) cho admin-api.
resource "terraform_data" "layer" {
  triggers_replace = filemd5("${path.module}/../backend/requirements.txt")
  provisioner "local-exec" {
    command = "rm -rf ${path.module}/.build/layer && python3 -m pip install -r ${path.module}/../backend/requirements.txt -t ${path.module}/.build/layer/python --platform manylinux2014_aarch64 --only-binary=:all: --python-version 3.12 --implementation cp --quiet"
  }
}

data "archive_file" "layer" {
  type        = "zip"
  source_dir  = "${path.module}/.build/layer"
  output_path = "${path.module}/.build/layer.zip"
  depends_on  = [terraform_data.layer]
}

resource "aws_lambda_layer_version" "deps" {
  layer_name               = "${local.name}-deps"
  filename                 = data.archive_file.layer.output_path
  source_code_hash         = data.archive_file.layer.output_base64sha256
  compatible_runtimes      = ["python3.12"]
  compatible_architectures = ["arm64"]
}

resource "aws_lambda_function" "public" {
  function_name    = "${local.name}-public-api"
  role             = aws_iam_role.public.arn
  runtime          = "python3.12"
  architectures    = ["arm64"]
  handler          = "public_api.handler.handler"
  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256
  memory_size      = 256
  timeout          = 10
  depends_on       = [aws_cloudwatch_log_group.public]

  environment {
    variables = { TABLE_NAME = aws_dynamodb_table.main.name }
  }
}

resource "aws_lambda_function" "admin" {
  function_name    = "${local.name}-admin-api"
  role             = aws_iam_role.admin.arn
  runtime          = "python3.12"
  architectures    = ["arm64"]
  handler          = "admin_api.handler.handler"
  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256
  memory_size      = 512
  timeout          = 30
  layers           = [aws_lambda_layer_version.deps.arn]
  depends_on       = [aws_cloudwatch_log_group.admin]

  environment {
    variables = {
      TABLE_NAME   = aws_dynamodb_table.main.name
      FILES_BUCKET = aws_s3_bucket.files.bucket
      WEB_BASE_URL = local.web_origin
    }
  }
}

# ---------- API Gateway HTTP API ----------
resource "aws_apigatewayv2_api" "api" {
  name          = "${local.name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [local.web_origin, "http://localhost:5173"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.api.id
  name             = "cognito"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.admin.id}"
  }
}

resource "aws_apigatewayv2_integration" "public" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.public.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "admin" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "public" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /public/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.public.id}"
}

resource "aws_apigatewayv2_route" "admin" {
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "ANY /admin/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.admin.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Preflight CORS không mang token: nếu rơi vào route ANY có JWT thì bị 401 và trình duyệt báo lỗi CORS.
# Route OPTIONS riêng, không xác thực; API Gateway tự trả header CORS theo cors_configuration.
resource "aws_apigatewayv2_route" "admin_preflight" {
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "OPTIONS /admin/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.admin.id}"
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  # route_settings tham chiếu route_key theo chuỗi nên phải đợi route tạo xong.
  depends_on = [aws_apigatewayv2_route.public, aws_apigatewayv2_route.admin, aws_apigatewayv2_route.admin_preflight]

  default_route_settings {
    throttling_rate_limit  = 20
    throttling_burst_limit = 40
  }
  route_settings {
    route_key              = "ANY /admin/{proxy+}"
    throttling_rate_limit  = 10
    throttling_burst_limit = 20
  }
}

resource "aws_lambda_permission" "public" {
  statement_id  = "AllowApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.public.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin" {
  statement_id  = "AllowApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# ---------- Tên miền API (chứng chỉ ACM xác thực bằng CNAME tại P.A Vietnam) ----------
resource "aws_acm_certificate" "api" {
  count             = var.enable_custom_domains ? 1 : 0
  domain_name       = local.api_domain
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

# Resource này chờ bạn thêm CNAME xác thực ở P.A Vietnam (lấy từ output acm_validation_cname).
resource "aws_acm_certificate_validation" "api" {
  count           = var.enable_custom_domains ? 1 : 0
  certificate_arn = aws_acm_certificate.api[0].arn
}

resource "aws_apigatewayv2_domain_name" "api" {
  count       = var.enable_custom_domains ? 1 : 0
  domain_name = local.api_domain
  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api[0].certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api" {
  count       = var.enable_custom_domains ? 1 : 0
  api_id      = aws_apigatewayv2_api.api.id
  domain_name = aws_apigatewayv2_domain_name.api[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

# ---------- Amplify Hosting: frontend ----------
resource "aws_amplify_app" "web" {
  count        = var.github_repository == "" ? 0 : 1
  name         = "${local.name}-web"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB"

  build_spec = <<-YAML
    version: 1
    applications:
      - appRoot: frontend
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: dist
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
  YAML

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "frontend"
    VITE_API_URL              = var.enable_custom_domains ? "https://${local.api_domain}" : aws_apigatewayv2_api.api.api_endpoint
    VITE_COGNITO_REGION       = var.region
    VITE_COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.web.id
  }
}

resource "aws_amplify_branch" "main" {
  count       = var.github_repository == "" ? 0 : 1
  app_id      = aws_amplify_app.web[0].id
  branch_name = var.github_branch
  stage       = "PRODUCTION"
  framework   = "React"
}

resource "aws_amplify_domain_association" "web" {
  count       = var.github_repository != "" && var.enable_custom_domains ? 1 : 0
  app_id      = aws_amplify_app.web[0].id
  domain_name = var.domain
  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = var.web_subdomain
  }
  wait_for_verification = false
}

# ---------- Cảnh báo chi phí ----------
resource "aws_budgets_budget" "monthly" {
  name         = "${local.name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.admin_email]
  }
}

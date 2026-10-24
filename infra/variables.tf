variable "region" {
  type    = string
  default = "ap-southeast-2"
}

variable "domain" {
  description = "Tên miền gốc, DNS giữ tại P.A Vietnam"
  type        = string
  default     = "hachauctn.id.vn"
}

variable "web_subdomain" {
  type    = string
  default = "www"
}

variable "api_subdomain" {
  type    = string
  default = "api"
}

variable "enable_custom_domains" {
  description = "Bật sau khi đã hiểu quy trình xác thực CNAME (xem README). Lần apply đầu để false."
  type        = bool
  default     = false
}

variable "admin_email" {
  description = "Email tài khoản Admin duy nhất"
  type        = string
}

variable "github_repository" {
  description = "URL repo GitHub, ví dụ https://github.com/<user>/quan-ly-du-an. Để trống thì không tạo Amplify app."
  type        = string
  default     = ""
}

variable "github_access_token" {
  description = "GitHub token (quyền đọc repo + webhook) để Amplify kết nối repo"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "budget_limit_usd" {
  type    = number
  default = 10
}

variable "log_retention_days" {
  type    = number
  default = 14
}

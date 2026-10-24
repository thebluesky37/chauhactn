output "api_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "files_bucket" {
  value = aws_s3_bucket.files.bucket
}

output "amplify_default_domain" {
  value = try(aws_amplify_app.web[0].default_domain, null)
}

# Bản ghi CNAME cần nhập tại P.A Vietnam (xem README).
output "acm_validation_cname" {
  value = var.enable_custom_domains ? [
    for o in aws_acm_certificate.api[0].domain_validation_options : {
      name  = o.resource_record_name
      value = o.resource_record_value
    }
  ] : null
}

output "api_custom_domain_target" {
  value = try(aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name, null)
}

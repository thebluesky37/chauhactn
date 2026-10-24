terraform {
  required_version = ">= 1.10"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 5.70" }
    archive = { source = "hashicorp/archive", version = "~> 2.6" }
  }

  # Tạo bucket state thủ công một lần, rồi bỏ comment và chạy `terraform init -migrate-state`.
  # backend "s3" {
  #   bucket       = "hachauctn-pm-tfstate"
  #   key          = "prod/terraform.tfstate"
  #   region       = "ap-southeast-1"
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = "quan-ly-du-an", ManagedBy = "terraform" }
  }
}

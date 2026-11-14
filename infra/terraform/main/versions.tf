terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Konfiguracja bucketu w ../backend.hcl: tofu init -backend-config=../backend.hcl
  backend "s3" {
    key = "main/terraform.tfstate"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "tetris"
      ManagedBy = "opentofu"
    }
  }
}

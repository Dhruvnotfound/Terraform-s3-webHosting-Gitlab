terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

# Configure the AWS Provider
  provider "aws" {
  region     = $AWS_DEFAULT_REGION
  access_key = $AWS_ACCESS_KEY_ID
  secret_key = $AWS_SECRET_ACCESS_KEY
}
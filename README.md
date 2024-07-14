
# Terraform S3 Static Website Hosting

This project demonstrates how to set up an AWS S3 bucket for static website hosting using Terraform, and how to manage the deployment of website files using a GitLab CI pipeline.

## Project Overview

This project automates the provisioning of an S3 bucket for static website hosting, including setting up a bucket policy, public access block configuration, and website configuration. The deployment of HTML, CSS, and JavaScript files to the S3 bucket is managed using a GitLab CI pipeline.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) installed on your local machine.
- [GitLab CI](https://docs.gitlab.com/ee/ci/) setup in your GitLab repository.
- AWS account with appropriate permissions to manage S3 resources.
- AWS CLI configured with your AWS credentials.

## Setup Instructions

### Terraform Configuration

1. **Create a Terraform Configuration File**

   Create a file named `s3.tf` and add the following configuration:

  ```hcl
  resource "aws_s3_bucket" "es-s3" {
  bucket        = "element-simulation-3107"
  force_destroy = true
  tags = {
    Environment = "Dev"
  }
}
resource "aws_s3_bucket_website_configuration" "es-s3hosting" {
  bucket = aws_s3_bucket.es-s3.id
  index_document {
    suffix = "element-simulator.html"
  }
}
resource "aws_s3_bucket_public_access_block" "es-s3public" {
  bucket = aws_s3_bucket.es-s3.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
resource "aws_s3_bucket_policy" "allow_access_from_another_account" {
  bucket = aws_s3_bucket.es-s3.id
  policy = data.aws_iam_policy_document.allow_access_from_another_account.json
}

data "aws_iam_policy_document" "allow_access_from_another_account" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "s3:GetObject",
    ]
    resources = [
      aws_s3_bucket.es-s3.arn,
      "${aws_s3_bucket.es-s3.arn}/*",
    ]
  }
}
   ```

2. **Initialize Terraform**

   ```sh
   terraform init
   ```

3. **Validate Terraform Configuration**

   ```sh
   terraform validate
   ```

4. **Apply Terraform Configuration**

   ```sh
   terraform apply
   ```

### GitLab CI Pipeline

1. **Create a GitLab CI Configuration File**

   Create a file named `.gitlab-ci.yml` and add the following configuration:

  ```yaml
  stages:
    - validate
    - plan
    - apply
    - upload
    - destroy

  image:
    name: hashicorp/terraform:$TF_VERSION
    entrypoint:
    - '/usr/bin/env'
    - 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

variables:
    TF_VERSION: 1.9.2
    TF_WORKING_DIR: terraform ## Specify the directory containing your Terraform scripts
    TF_VAR_aws_region: ${AWS_DEFAULT_REGION}
    TF_VAR_aws_access_key: ${AWS_ACCESS_KEY_ID}
    TF_VAR_aws_secret_key: ${AWS_SECRET_ACCESS_KEY}
    AWS_BUCKET_NAME: element-simulation-3107 #your bucket name

before_script:
    - terraform --version
    - cd $TF_WORKING_DIR
    - terraform init

validate:
    stage: validate
    script:
        - terraform validate

plan:
    stage: plan
    script:
        - terraform plan -out=tfplan
    artifacts:
        paths:
            - $TF_WORKING_DIR/tfplan

apply:
    stage: apply
    script:
        - terraform apply -auto-approve tfplan
    artifacts:
        paths:
            - $TF_WORKING_DIR/terraform.tfstate
            - $TF_WORKING_DIR/terraform.tfstate.backup
    when: manual

deploy to s3:
    stage: upload
    image: 
        name: amazon/aws-cli:2.17.11
        entrypoint: [""]
    before_script: []
    script:
        - aws --version
        - aws s3 sync build/ s3://$AWS_BUCKET_NAME/
    needs:
        - apply

destroy:
    stage: destroy
    script:
        - terraform destroy -auto-approve
    when: manual
   ```

## Usage

1. **Running the Pipeline**

   Push your code to the GitLab repository. The GitLab CI pipeline will automatically run, executing the stages defined in `.gitlab-ci.yml`.

2. **Deploying the Website**

   After the `apply` stage is completed, manually trigger the `deploy-to-s3` stage to upload your website files to the S3 bucket.

3. **Destroying Resources**

   To destroy the resources created by Terraform, manually trigger the `destroy` stage.

## Troubleshooting

- **Access Denied Errors:**
  Ensure that your AWS credentials have the necessary permissions to manage S3 resources.
  
- **MIME Type Issues:**
  Ensure that the correct `Content-Type` headers are set for your files during the upload to S3.

- **Pipeline Errors:**
  Review the pipeline logs in GitLab CI for detailed error messages and troubleshoot accordingly.

## Contributing

Feel free to open issues or submit pull requests for improvements and bug fixes.

---
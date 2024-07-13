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
    suffix = "index.html"
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
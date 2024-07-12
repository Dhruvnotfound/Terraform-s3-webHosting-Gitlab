resource "aws_s3_bucket" "s3" {
  bucket = "element-simulation-3107"
force_destroy = true
  tags = {
    Environment = "Dev"
  }
}
resource "aws_s3_bucket_website_configuration" "s3hosting" {
  bucket = aws_s3_bucket.s3.id
  index_document {
    suffix = "index.html"
  }
}
resource "aws_s3_bucket_ownership_controls" "s3public" {
  bucket = aws_s3_bucket.s3.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}
resource "aws_s3_bucket_policy" "allow_access_from_another_account" {
  bucket = aws_s3_bucket.example.id
  policy = data.aws_iam_policy_document.allow_access_from_another_account.json
}

data "aws_iam_policy_document" "allow_access_from_another_account" {
  statement {
    principals {
      type        = "AWS"
      identifiers = "*"
    }
    actions = [
      "s3:GetObject",
    ]
    resources = [
      "${aws_s3_bucket.s3.arn}/*",
    ]
  }
}

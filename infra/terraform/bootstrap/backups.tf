# --- Backupy Postgresa (ADR-0008) ---------------------------------------------
# Bucket żyje w bootstrapie, więc backupy przeżywają `tofu destroy` w `main`.

resource "aws_s3_bucket" "backups" {
  bucket = "tetris-backups-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Retencja 30 dni dla obu środowisk.
resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-30-days"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

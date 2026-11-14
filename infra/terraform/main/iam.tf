# Rola serwera: agent SSM (deploy, dostęp administracyjny), pobieranie obrazów i chartów z ECR
# oraz backupy Postgresa w S3.

data "aws_iam_policy_document" "ec2_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "server" {
  name               = "tetris-server"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
}

resource "aws_iam_role_policy_attachment" "server" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
  ])

  role       = aws_iam_role.server.name
  policy_arn = each.key
}

resource "aws_iam_instance_profile" "server" {
  name = "tetris-server"
  role = aws_iam_role.server.name
}

# Backupy Postgresa (ADR-0008): CronJob zapisuje dumpy, a odtworzenie przez SSM je czyta.
# Bucket powstaje w bootstrapie; nazwa wynika z id konta.
data "aws_caller_identity" "current" {}

locals {
  backup_bucket_arn = "arn:aws:s3:::tetris-backups-${data.aws_caller_identity.current.account_id}"
}

data "aws_iam_policy_document" "backups" {
  statement {
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${local.backup_bucket_arn}/*"]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [local.backup_bucket_arn]
  }
}

resource "aws_iam_role_policy" "backups" {
  name   = "postgres-backups"
  role   = aws_iam_role.server.id
  policy = data.aws_iam_policy_document.backups.json
}

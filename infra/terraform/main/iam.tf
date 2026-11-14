# Rola serwera: agent SSM (deploy, dostęp administracyjny) i pobieranie obrazów oraz chartów z ECR.

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

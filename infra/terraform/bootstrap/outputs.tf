output "github_deploy_role_arn" {
  description = "Wstaw jako zmienną repo AWS_DEPLOY_ROLE_ARN w GitHubie."
  value       = aws_iam_role.github_deploy.arn
}

output "ecr_registry" {
  value = "${local.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "ecr_repositories" {
  value = { for name, repo in aws_ecr_repository.this : name => repo.repository_url }
}

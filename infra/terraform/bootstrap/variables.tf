variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "github_oidc_sub_prefix" {
  description = <<-EOT
    Prefiks pola `sub` w tokenie OIDC GitHuba. Repo używa niezmiennych identyfikatorów
    (owner@id/repo@id), więc zmiana nazwy lub usunięcie repo nie przekaże dostępu innemu repo.
    Odczyt: gh api repos/<owner>/<repo>/actions/oidc/customization/sub --jq .sub_claim_prefix
  EOT
  type        = string
  default     = "repo:borys94@11800853/tetris-multiplayer@1455651954"
}

variable "create_github_oidc_provider" {
  description = "Ustaw na false, jeśli konto ma już providera OIDC dla token.actions.githubusercontent.com."
  type        = bool
  default     = true
}

variable "ecr_keep_last" {
  description = "Ile ostatnich obrazów i chartów trzymać w ECR."
  type        = number
  default     = 30
}

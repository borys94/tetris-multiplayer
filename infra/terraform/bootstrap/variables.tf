variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "github_repo" {
  description = "Repozytorium GitHub (owner/name), z którego workflowy mogą przejąć rolę deployu."
  type        = string
  default     = "borys94/tetris-multiplayer"
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

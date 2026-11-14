variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "availability_zone" {
  type    = string
  default = "eu-central-1a"
}

variable "instance_type" {
  description = "Typ instancji arm64 (Graviton); obraz aplikacji jest budowany pod arm64."
  type        = string
  default     = "t4g.small"
}

variable "root_volume_gb" {
  type    = number
  default = 20
}

variable "k3s_version" {
  type    = string
  default = "v1.37.2+k3s1"
}

variable "ecr_credential_provider_version" {
  description = "Wersja z kubernetes/cloud-provider-aws, zgodna z wersją Kubernetesa w k3s."
  type        = string
  default     = "v1.37.0"
}

variable "helm_version" {
  type    = string
  default = "v4.3.2"
}

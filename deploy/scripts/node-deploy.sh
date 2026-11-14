#!/usr/bin/env bash
# Uruchamiany NA SERWERZE przez SSM (ADR-0005): instaluje lub aktualizuje release Helm.
# Użycie: node-deploy.sh <beta|prod> <sha> <rejestr ECR> <region> [true|false]
set -euo pipefail

env="$1" version="$2" registry="$3" region="$4" basic_auth="${5:-}"

case "$env" in
  beta) namespace=tetris-beta host_prefix="beta." ;;
  prod) namespace=tetris-prod host_prefix="" ;;
  *) echo "Nieznane środowisko: $env" >&2; exit 2 ;;
esac

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
export PATH="$PATH:/usr/local/bin:/snap/bin"

# Publiczny adres (Elastic IP) z metadanych instancji (IMDSv2).
token=$(curl -sf -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
ip=$(curl -sf -H "X-aws-ec2-metadata-token: $token" http://169.254.169.254/latest/meta-data/public-ipv4)
host="${host_prefix}${ip}.sslip.io"

kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f - >/dev/null
# Basic auth: domyślnie tylko beta (prod jest publiczny od M4, ADR-0003); zmienna BASIC_AUTH
# środowiska GitHub może to nadpisać (np. tymczasowo wyłączyć na becie).
auth_args=()
if [ -n "$basic_auth" ]; then
  auth_args=(--set "basicAuth.enabled=$basic_auth")
  auth_enabled="$basic_auth"
elif [ "$env" = beta ]; then
  auth_enabled=true
else
  auth_enabled=false
fi
if [ "$auth_enabled" = true ] && ! kubectl -n "$namespace" get secret basic-auth >/dev/null 2>&1; then
  echo "Brak Secretu basic-auth w $namespace. Utwórz go według docs/runbooks/deploy.md." >&2
  exit 1
fi

# Bucket na backupy Postgresa z bootstrapu (ADR-0008) ma w nazwie id konta.
account=$(aws sts get-caller-identity --query Account --output text)

aws ecr get-login-password --region "$region" | helm registry login "$registry" --username AWS --password-stdin

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
helm pull "oci://$registry/charts/tetris" --version "0.0.0-g$version" --untar -d "$workdir"

helm upgrade --install tetris "$workdir/tetris" \
  --namespace "$namespace" \
  --values "$workdir/tetris/values-$env.yaml" \
  --set host="$host" \
  --set image.repository="$registry/tetris-app" \
  --set image.tag="$version" \
  --set backup.bucket="tetris-backups-${account}" \
  "${auth_args[@]}" \
  --rollback-on-failure \
  --timeout 3m

echo "Wdrożono $version na https://$host (basic auth: $auth_enabled)"

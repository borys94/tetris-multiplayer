#!/usr/bin/env bash
# Uruchamiany NA SERWERZE przez SSM (ADR-0005): instaluje lub aktualizuje chart monitoring
# (kube-prometheus-stack, Grafana, alerty, dashboard; spec 006) w namespace `monitoring`.
# Użycie: node-monitoring-deploy.sh <sha> <rejestr ECR> <region>
set -euo pipefail

version="$1" registry="$2" region="$3"
namespace=monitoring

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
export PATH="$PATH:/usr/local/bin:/snap/bin"

# Publiczny adres (Elastic IP) z metadanych instancji (IMDSv2).
token=$(curl -sf -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
ip=$(curl -sf -H "X-aws-ec2-metadata-token: $token" http://169.254.169.254/latest/meta-data/public-ipv4)
host="grafana.${ip}.sslip.io"

aws ecr get-login-password --region "$region" | helm registry login "$registry" --username AWS --password-stdin

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
helm pull "oci://$registry/charts/monitoring" --version "0.0.0-g$version" --untar -d "$workdir"

# Pierwsza instalacja pobiera obrazy Prometheusa i Grafany, stąd dłuższy timeout.
helm upgrade --install monitoring "$workdir/monitoring" \
  --namespace "$namespace" --create-namespace \
  --set host="$host" \
  --set "kube-prometheus-stack.grafana.env.GF_SERVER_ROOT_URL=https://$host" \
  --rollback-on-failure \
  --timeout 10m

echo "Monitoring $version: https://$host"

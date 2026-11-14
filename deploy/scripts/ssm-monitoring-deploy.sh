#!/usr/bin/env bash
# Uruchamiany W CI (lub lokalnie): wysyła node-monitoring-deploy.sh na serwer przez SSM.
# Użycie: ssm-monitoring-deploy.sh <sha>   (chart 0.0.0-g<sha> musi być już w ECR)
set -euo pipefail

version="$1"
script_dir="$(cd "$(dirname "$0")" && pwd)"
: "${AWS_REGION:=eu-central-1}"
export AWS_REGION

account=$(aws sts get-caller-identity --query Account --output text)
registry="$account.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Deploy monitoringu $version"
"$script_dir/ssm-run.sh" "bash -s -- '$version' '$registry' '$AWS_REGION' <<'NODE_DEPLOY'
$(cat "$script_dir/node-monitoring-deploy.sh")
NODE_DEPLOY"

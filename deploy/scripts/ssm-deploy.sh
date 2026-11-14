#!/usr/bin/env bash
# Uruchamiany W CI (lub lokalnie): wysyła node-deploy.sh na serwer przez SSM (ADR-0005).
# Użycie: ssm-deploy.sh <beta|prod> <sha> [true|false]
# Trzeci argument nadpisuje basic auth z values-<env>.yaml (pusty: bez zmian).
set -euo pipefail

env="$1" version="$2" basic_auth="${3:-}"
case "$basic_auth" in
  "" | true | false) ;;
  *) echo "Basic auth musi być true, false albo pusty, jest: $basic_auth" >&2; exit 2 ;;
esac
script_dir="$(cd "$(dirname "$0")" && pwd)"
: "${AWS_REGION:=eu-central-1}"
export AWS_REGION

account=$(aws sts get-caller-identity --query Account --output text)
registry="$account.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Deploy $version na $env (basic auth: ${basic_auth:-z values})"
"$script_dir/ssm-run.sh" "bash -s -- '$env' '$version' '$registry' '$AWS_REGION' '$basic_auth' <<'NODE_DEPLOY'
$(cat "$script_dir/node-deploy.sh")
NODE_DEPLOY"

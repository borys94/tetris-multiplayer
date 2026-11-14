#!/usr/bin/env bash
# Uruchamia komendę na serwerze tetris-k3s przez SSM, czeka na wynik i go wypisuje.
# Działa lokalnie (po zalogowaniu do AWS) i w CI. kubectl i helm mają ustawiony KUBECONFIG.
# Użycie: ssm-run.sh '<komenda>'
set -euo pipefail

: "${AWS_REGION:=eu-central-1}"
export AWS_REGION

instance_id=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=tetris-k3s" "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].InstanceId" --output text)
if [[ -z "$instance_id" ]]; then
  echo "Serwer tetris-k3s nie działa. Uruchom go (Infra power: start) i spróbuj ponownie." >&2
  exit 1
fi

# Komendę przekazujemy w base64, żeby uniknąć problemów z cudzysłowami w parametrach SSM.
# shellcheck disable=SC2016 # $PATH ma się rozwinąć na serwerze, nie lokalnie.
payload=$(printf 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml PATH="$PATH:/usr/local/bin:/snap/bin"\n%s\n' "$1" | base64 | tr -d '\n')

command_id=$(aws ssm send-command \
  --instance-ids "$instance_id" \
  --document-name AWS-RunShellScript \
  --parameters "commands=[\"echo $payload | base64 -d | bash\"],executionTimeout=[\"600\"]" \
  --query Command.CommandId --output text)

status=Pending
for _ in $(seq 1 120); do
  status=$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$instance_id" \
    --query Status --output text 2>/dev/null || echo Pending)
  case "$status" in
    Pending | InProgress | Delayed) sleep 5 ;;
    *) break ;;
  esac
done

aws ssm get-command-invocation --command-id "$command_id" --instance-id "$instance_id" \
  --query StandardOutputContent --output text
aws ssm get-command-invocation --command-id "$command_id" --instance-id "$instance_id" \
  --query StandardErrorContent --output text >&2

[[ "$status" == "Success" ]] || { echo "SSM: $status" >&2; exit 1; }

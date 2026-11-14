# Runbook: deploy na AWS

Infrastruktura i deploy z [spec 003](../specs/003-deploy-aws.md): serwer EC2 z k3s w eu-central-1, beta i prod w jednym klastrze, deploy przez SSM i Helm ([ADR-0005](../adr/0005-deploy-przez-ssm-i-helm.md)).

Wszystkie komendy uruchamiamy z katalogu głównego repo.

## Wymagania

- `brew install awscli opentofu helm`
- AWS CLI zalogowane na konto z uprawnieniami administratora: `aws sts get-caller-identity` zwraca konto.
- `gh` zalogowane do GitHuba z prawami admina repo.

## 1. Pierwsze uruchomienie

### 1.1. Bucket na stan OpenTofu (raz na konto)

```sh
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET=tetris-tofu-state-$ACCOUNT_ID
aws s3api create-bucket --bucket "$BUCKET" --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
sed "s/<ACCOUNT_ID>/$ACCOUNT_ID/" infra/terraform/backend.hcl.example > infra/terraform/backend.hcl
```

### 1.2. Bootstrap: ECR i rola dla GitHub Actions

```sh
cd infra/terraform/bootstrap
tofu init -backend-config=../backend.hcl
tofu apply
gh variable set AWS_DEPLOY_ROLE_ARN --body "$(tofu output -raw github_deploy_role_arn)"
cd -
```

Jeśli konto ma już providera OIDC dla GitHuba, `apply` zgłosi konflikt; wtedy uruchom `tofu apply -var create_github_oidc_provider=false`.

### 1.3. Środowiska GitHub

```sh
REPO=borys94/tetris-multiplayer
gh api -X PUT "repos/$REPO/environments/beta" >/dev/null
gh api -X PUT "repos/$REPO/environments/production" --input - <<EOF
{"reviewers":[{"type":"User","id":$(gh api user --jq .id)}],"deployment_branch_policy":null}
EOF
```

Środowisko `production` wymaga akceptacji przed każdym deployem na prod.

### 1.4. Serwer z k3s

```sh
cd infra/terraform/main
tofu init -backend-config=../backend.hcl
tofu apply
cd -
```

cloud-init instaluje k3s, Helm i AWS CLI w ok. 3–5 minut. Sprawdzenie (scenariusz S1):

```sh
deploy/scripts/ssm-run.sh 'kubectl get nodes; cloud-init status'
```

Oczekiwany wynik: węzeł `Ready` i `status: done`.

### 1.5. Hasło basic auth (ADR-0003)

Ustaw login i hasło dla obu środowisk (podmień `HASLO`):

```sh
deploy/scripts/ssm-run.sh '
for ns in tetris-beta tetris-prod; do
  kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
  htpasswd -nbB tetris "HASLO" | kubectl -n $ns create secret generic basic-auth \
    --from-file=users=/dev/stdin --dry-run=client -o yaml | kubectl apply -f -
done'
```

Hasło trafia do historii komend SSM w koncie AWS (widocznej dla administratorów konta), ale nie do repo ani logów GitHuba. Zmiana hasła: uruchom tę samą komendę z nowym hasłem.

### 1.6. Pierwszy deploy

Merge do `main` wdraża betę automatycznie. Bez nowego merge'a: **Actions → Deploy → Run workflow**, środowisko `beta`, wersja = SHA ostatniego commita z `main` (jego obraz musi być już w ECR).

## 2. Codzienna praca

| Zadanie            | Jak                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Deploy na betę     | Merge PR do `main`                                                                                           |
| Deploy na prod     | **Actions → Deploy → Run workflow**: `prod` + SHA działający na becie → akceptacja w środowisku `production` |
| Sprawdzenie wersji | `curl -u tetris:HASLO https://beta.<IP>.sslip.io/health`                                                     |
| Rollback           | **Deploy → Run workflow** z SHA poprzedniej wersji. Nieudany deploy cofa się sam (`--rollback-on-failure`)   |
| Adresy             | `cd infra/terraform/main && tofu output`                                                                     |

## 3. Oszczędzanie kosztów

### Stop/start (ok. 5 USD/mies. w stanie zatrzymanym)

**Actions → Infra power → Run workflow**: `stop`, `start` albo `status`. Lokalnie:

```sh
ID=$(cd infra/terraform/main && tofu output -raw instance_id)
aws ec2 stop-instances --instance-ids "$ID"    # albo start-instances
```

Po starcie adresy, certyfikaty i wdrożona wersja zostają bez zmian; aplikacja odpowiada po 1–2 minutach. Deploy przy zatrzymanym serwerze kończy się błędem: uruchom serwer i ponów job.

### Pełne usunięcie (< 1 USD/mies.)

```sh
cd infra/terraform/main && tofu destroy
```

Zostaje bootstrap (stan, ECR z obrazami, rola OIDC). Odtworzenie: kroki 1.4, 1.5 i 1.6. Serwer dostanie nowe IP, więc zmienią się adresy sslip.io.

Usunięcie wszystkiego: najpierw `main`, potem `tofu destroy` w `bootstrap`, na końcu bucket ze stanem (`aws s3 rb s3://tetris-tofu-state-<ACCOUNT_ID> --force`, po usunięciu wersji obiektów).

## 4. Diagnostyka

```sh
deploy/scripts/ssm-run.sh 'tail -50 /var/log/cloud-init-output.log'      # bootstrap serwera
deploy/scripts/ssm-run.sh 'kubectl get pods -A'                          # stan klastra
deploy/scripts/ssm-run.sh 'helm history tetris -n tetris-beta'           # historia deployów
deploy/scripts/ssm-run.sh 'kubectl -n kube-system logs deploy/traefik | grep -i acme | tail'  # certyfikaty
```

Certyfikat Let's Encrypt pojawia się przy pierwszym wejściu na nowy host i wymaga otwartego portu 80 (wyzwanie HTTP-01).

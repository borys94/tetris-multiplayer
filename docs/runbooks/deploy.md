# Runbook: deploy na AWS

Infrastruktura i deploy z [spec 003](../specs/003-deploy-aws.md): serwer EC2 z k3s w eu-central-1, beta i prod w jednym klastrze, deploy przez SSM i Helm ([ADR-0005](../adr/0005-deploy-przez-ssm-i-helm.md)). Od M4 ([spec 004](../specs/004-serwer-zrodlem-prawdy.md)) prod jest publiczny, a beta zostaje za basic auth. Od M5 ([spec 005](../specs/005-konta-wyniki.md)) każde środowisko ma własnego Postgresa z backupem do S3 (sekcja 6).

Wszystkie komendy uruchamiamy z katalogu głównego repo, z ustawionym regionem:

```sh
export AWS_PROFILE=tetris AWS_REGION=eu-central-1
```

## Wymagania

- `brew install awscli opentofu helm`
- AWS CLI zalogowane jako użytkownik IAM Identity Center z zestawem uprawnień `AdministratorAccess` (nie root), profil `tetris`:

  ```sh
  aws configure sso --profile tetris   # SSO start URL z IAM Identity Center, region eu-central-1
  aws sso login --profile tetris       # gdy sesja (8 h) wygaśnie
  export AWS_PROFILE=tetris
  aws sts get-caller-identity          # Arn zawiera AWSReservedSSO_AdministratorAccess
  ```

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

Repo wysyła token OIDC z niezmiennymi identyfikatorami (`repo:owner@id/repo@id:...`). Przy nowym repo ustaw `github_oidc_sub_prefix` na wynik `gh api repos/<owner>/<repo>/actions/oidc/customization/sub --jq .sub_claim_prefix`.

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

Bootstrap tworzy też bucket `tetris-backups-<ACCOUNT_ID>` na backupy Postgresa (retencja 30 dni).

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

### 1.5. Hasło basic auth bety (ADR-0003)

Ustaw login i hasło dla bety (podmień `HASLO`). Prod od M4 jest publiczny i hasła nie potrzebuje (sekcja 5).

```sh
deploy/scripts/ssm-run.sh '
ns=tetris-beta
kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
htpasswd -nbB tetris "HASLO" | kubectl -n $ns create secret generic basic-auth \
  --from-file=users=/dev/stdin --dry-run=client -o yaml | kubectl apply -f -'
```

**Przełącznik basic auth:** zmienna `BASIC_AUTH` środowiska GitHub (`beta` albo `production`) nadpisuje `basicAuth.enabled` z `values-<env>.yaml` przy każdym deployu: `true`, `false` albo brak zmiennej (wartość z chartu). Zmiana działa od następnego deployu danego środowiska:

```sh
gh variable set BASIC_AUTH --env beta --body false   # beta bez hasła
gh variable delete BASIC_AUTH --env beta             # powrót do values (beta z hasłem)
```

Od 2026-11-14 beta jest tymczasowo bez hasła (`BASIC_AUTH=false`): przy basic auth przeglądarka nie łączyła się z WebSocketem gry na becie.

Hasło trafia do historii komend SSM w koncie AWS (widocznej dla administratorów konta), ale nie do repo ani logów GitHuba. Zmiana hasła: uruchom tę samą komendę z nowym hasłem.

### 1.6. Pierwszy deploy

Merge do `main` wdraża betę automatycznie. Bez nowego merge'a: **Actions → Deploy → Run workflow**, środowisko `beta`, wersja = SHA ostatniego commita z `main` (jego obraz musi być już w ECR).

## 2. Codzienna praca

| Zadanie            | Jak                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Deploy na betę     | Merge PR do `main`                                                                                           |
| Deploy na prod     | **Actions → Deploy → Run workflow**: `prod` + SHA działający na becie → akceptacja w środowisku `production` |
| Sprawdzenie wersji | Beta: `curl -u tetris:HASLO https://beta.<IP>.sslip.io/health`; prod: `curl https://<IP>.sslip.io/health`    |
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

Sesje gry żyją w pamięci poda ([ADR-0006](../adr/0006-serwer-zrodlem-prawdy.md)): każdy deploy i restart poda kończy trwające gry. Klienci łączą się ponownie sami i zaczynają nową grę.

## 5. Publiczny prod (M4)

Prod jest publiczny, bo `values-prod.yaml` ma `basicAuth.enabled: false` (ADR-0003). Beta zostaje zamknięta na stałe.

**Sprawdzenie po deployu (scenariusz S5 ze spec 004):**

```sh
IP=$(cd infra/terraform/main && tofu output -raw public_ip)
curl -s -o /dev/null -w '%{http_code}\n' "https://$IP.sslip.io/"        # 200
curl -s -o /dev/null -w '%{http_code}\n' "https://beta.$IP.sslip.io/"   # 401
# Upgrade do WebSocketu z obcym Origin jest odrzucany: 403
curl -s -o /dev/null -w '%{http_code}\n' --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  -H 'Origin: https://evil.example' "https://$IP.sslip.io/ws"
```

Potem zagraj na `https://<IP>.sslip.io` w przeglądarce. Status w panelu powinien pokazywać „Połączono”.

**Limit połączeń na IP jest wyłączony** (`game.maxConnectionsPerIp: 0`). Traefik w k3s ma `externalTrafficPolicy: Cluster` i widzi wszystkich klientów pod adresem `10.42.0.1` (sprawdzone 2026-11-14), więc limit objąłby wszystkich graczy naraz. Przed włączeniem limitu ustaw `externalTrafficPolicy: Local` w `HelmChartConfig` Traefika. Uwaga: zmiana szablonu cloud-init odtwarza serwer przy `tofu apply` (`user_data_replace_on_change`). Sprawdzenie, jaki adres widzi Traefik (przy otwartym połączeniu, np. `openssl s_client`):

```sh
deploy/scripts/ssm-run.sh 'nsenter -t "$(pgrep traefik | head -1)" -n ss -tn state established | grep 8443'
```

**Awaryjne zamknięcie prod** (np. przy incydencie) bez zmian w repo. Działa do następnego deployu prod. Najpierw utwórz Secret `basic-auth` w `tetris-prod` (komenda z 1.5 z `ns=tetris-prod`), potem:

```sh
deploy/scripts/ssm-run.sh '
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
cat <<EOF | kubectl -n tetris-prod apply -f -
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
spec:
  basicAuth:
    secret: basic-auth
    realm: Blockfall prod
EOF
kubectl -n tetris-prod annotate ingress tetris --overwrite \
  traefik.ingress.kubernetes.io/router.middlewares=tetris-prod-basic-auth@kubernetescrd'
```

Trwałe zamknięcie: `basicAuth.enabled: true` w `values-prod.yaml`, merge i deploy prod.

## 6. Baza danych i konta (M5)

Postgres działa w każdym namespace jako StatefulSet `postgres` z danymi na dysku serwera ([ADR-0008](../adr/0008-postgres-w-klastrze.md)). Hasło generuje chart przy pierwszej instalacji (Secret `postgres`, zostaje przy usunięciu release'u). Serwer aplikacji stosuje migracje przy starcie.

**Pierwszy admin** (konto musi już istnieć; podmień `LOGIN`, dla bety `tetris-beta`):

```sh
deploy/scripts/ssm-run.sh 'kubectl -n tetris-prod exec deploy/tetris -- node main.cjs promote LOGIN'
```

Kolejnych adminów nadaje się w panelu (`#/admin`).

**Backup:** CronJob `postgres-backup` codziennie o 03:00 (Europe/Warsaw) zapisuje `pg_dump -Fc` do `s3://tetris-backups-<ACCOUNT_ID>/<env>/<czas>.dump`. Bucket usuwa pliki po 30 dniach. Ręczny backup i lista plików:

```sh
deploy/scripts/ssm-run.sh 'kubectl -n tetris-beta create job --from=cronjob/postgres-backup backup-manual-$(date +%s)'
deploy/scripts/ssm-run.sh 'kubectl -n tetris-beta get jobs; kubectl -n tetris-beta logs job/<nazwa-joba> -c upload'
aws s3 ls "s3://tetris-backups-$(aws sts get-caller-identity --query Account --output text)/beta/"
```

**Test odtworzenia** (do pustej bazy obok produkcyjnej, bez przerwy w grze; podmień `PLIK`, np. `beta/2026-11-15T020000Z.dump`):

```sh
deploy/scripts/ssm-run.sh '
ns=tetris-beta; acct=$(aws sts get-caller-identity --query Account --output text)
aws s3 cp "s3://tetris-backups-$acct/PLIK" /tmp/restore.dump --only-show-errors
kubectl -n $ns exec postgres-0 -- createdb -U blockfall restore_test
kubectl -n $ns exec -i postgres-0 -- pg_restore -U blockfall -d restore_test --no-owner < /tmp/restore.dump
for db in blockfall restore_test; do
  echo "$db: konta, gry"
  kubectl -n $ns exec postgres-0 -- psql -U blockfall -d $db -tAc "select (select count(*) from users), (select count(*) from games)"
done
kubectl -n $ns exec postgres-0 -- dropdb -U blockfall restore_test
rm /tmp/restore.dump'
```

**Odtworzenie po awarii** zastępuje bieżące dane: najpierw zatrzymaj aplikację, potem przywróć dump, na końcu uruchom aplikację:

```sh
deploy/scripts/ssm-run.sh '
ns=tetris-prod; acct=$(aws sts get-caller-identity --query Account --output text)
aws s3 cp "s3://tetris-backups-$acct/PLIK" /tmp/restore.dump --only-show-errors
kubectl -n $ns scale deploy/tetris --replicas=0
kubectl -n $ns exec -i postgres-0 -- pg_restore -U blockfall -d blockfall --clean --if-exists --no-owner < /tmp/restore.dump
kubectl -n $ns scale deploy/tetris --replicas=1
rm /tmp/restore.dump'
```

Utrata dysku serwera (np. `tofu destroy` w `main`) usuwa bazy obu środowisk. Po odtworzeniu serwera i deployu przywróć ostatni dump według kroków powyżej.

**Dostęp do AWS z podów:** limit hopów IMDS to 2, więc pod mógłby pobrać uprawnienia roli serwera. NetworkPolicy `block-imds` odcina IMDS wszystkim podom poza backupem. Sprawdzenie (oczekiwany wynik: `blocked`):

```sh
deploy/scripts/ssm-run.sh 'kubectl -n tetris-prod exec deploy/tetris -- node -e "fetch(\"http://169.254.169.254/latest/api/token\",{method:\"PUT\",headers:{\"X-aws-ec2-metadata-token-ttl-seconds\":\"60\"},signal:AbortSignal.timeout(3000)}).then(()=>console.log(\"OPEN\"),()=>console.log(\"blocked\"))"'
```

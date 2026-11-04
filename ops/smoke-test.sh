#!/usr/bin/env bash
# Tests the built image before it is deployed: its own database and volume, loopback port only.
# Sends the headers Traefik sends, so the hostname logic behaves as it will in production.
#   ops/smoke-test.sh ghcr.io/bento-solutions/bento-web:<tag>
set -uo pipefail
IMG="${1:?usage: smoke-test.sh <image>}"
N=bwtest
PORT=3911
CMS=cms.bento212.com
PUB=bento212.com

cleanup() {
  docker rm -f "$N-web" "$N-db" >/dev/null 2>&1
  docker network rm "$N" >/dev/null 2>&1
  docker volume rm "$N-media" >/dev/null 2>&1
}
cleanup
trap cleanup EXIT

pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "  ok    $1 ($3)"; else fail=$((fail+1)); echo "  FAIL  $1: expected '$2', got '$3'"; fi
}
contains() { # name needle haystack
  if printf '%s' "$3" | grep -q -- "$2"; then pass=$((pass+1)); echo "  ok    $1"; else fail=$((fail+1)); echo "  FAIL  $1: '$2' not found"; fi
}

# Same forwarding headers as Traefik.
req() { # host path [curl args...]
  local host="$1" path="$2"; shift 2
  curl -sS --max-time 90 -H "Host: $host" -H "X-Forwarded-Host: $host" -H 'X-Forwarded-Proto: https' -H 'X-Forwarded-Port: 443' "$@" "http://127.0.0.1:$PORT$path"
}
code() { local host="$1" path="$2"; shift 2; req "$host" "$path" -o /dev/null -w '%{http_code}' "$@"; }

echo "== pull"
docker pull -q "$IMG" || { echo "PULL FAILED"; exit 3; }
docker image inspect "$IMG" --format 'size={{.Size}} user={{.Config.User}} cmd={{.Config.Cmd}}'

SETUP="$(openssl rand -hex 16)"
docker network create "$N" >/dev/null
docker run -d --name "$N-db" --network "$N" -e POSTGRES_PASSWORD=x -e POSTGRES_DB=bento_web postgres:16-alpine >/dev/null
for i in $(seq 1 30); do docker exec "$N-db" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

docker run -d --name "$N-web" --network "$N" -p "127.0.0.1:$PORT:3000" \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgres://postgres:x@$N-db:5432/bento_web" \
  -e PAYLOAD_SECRET="$(openssl rand -hex 16)" -e PREVIEW_SECRET="$(openssl rand -hex 16)" \
  -e SETUP_TOKEN="$SETUP" -e SITE_URL="https://$PUB" -e CMS_HOST="$CMS" -e CMS_URL="https://$CMS" \
  -v "$N-media:/app/media" "$IMG" >/dev/null

echo "== boot"
booted=no
for i in $(seq 1 90); do
  if docker exec "$N-web" wget -qO- http://127.0.0.1:3000/healthz >/dev/null 2>&1; then booted="yes after ${i}s"; break; fi
  sleep 1
done
echo "  healthy: $booted"
check "tables created by migrations on boot" "t" "$(docker exec "$N-db" psql -U postgres -d bento_web -Atc "select to_regclass('public.posts') is not null")"

echo "== host split and empty state"
check "public /blog" 200 "$(code $PUB /blog)"
check "public /admin hidden" 404 "$(code $PUB /admin)"
check "public /api hidden" 404 "$(code $PUB /api/users)"
check "public /en/blog before translations" 404 "$(code $PUB /en/blog)"
check "robots.txt" 200 "$(code $PUB /robots.txt)"
check "sitemap.xml" 200 "$(code $PUB /sitemap.xml)"
contains "sitemap uses the public origin" "https://$PUB" "$(req $PUB /sitemap.xml)"
check "cms / redirects" 307 "$(code $CMS /)"
check "cms redirect stays on the cms host" "https://$CMS/admin" "$(req $CMS / -o /dev/null -w '%{redirect_url}')"
contains "cms sends noindex" 'noindex' "$(req $CMS /admin -D - -o /dev/null | tr -d '\r' | grep -i x-robots-tag)"
check "graphql removed" 404 "$(code $CMS /api/graphql -X POST -H 'content-type: application/json' -d '{"query":"{__typename}"}')"

echo "== first administrator gate"
EMAIL=gate-test@example.test
PASS="$(openssl rand -hex 16)"
BODY="{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"confirm-password\":\"$PASS\",\"name\":\"Gate test\"}"
check "form hidden without the link" 404 "$(code $CMS /admin/create-first-user)"
check "api hidden without the link" 404 "$(code $CMS /api/users/first-register -X POST -H 'content-type: application/json' -d "$BODY")"
check "wrong token refused" 404 "$(code $CMS "/admin/create-first-user?setup=wrong")"
check "users still empty" 0 "$(docker exec "$N-db" psql -U postgres -d bento_web -Atc 'select count(*) from users')"
UNLOCK="$(req $CMS "/admin/create-first-user?setup=$SETUP" -D - -o /dev/null | tr -d '\r')"
contains "link sets the cookie" 'bento-setup=' "$UNLOCK"
contains "cookie is httpOnly" -i 'httponly' "$UNLOCK"
printf '%s' "$UNLOCK" | grep -i '^set-cookie' | grep -qi 'secure' && echo "  ok    cookie is Secure behind https" || echo "  note  cookie is not marked Secure"
check "link redirects without the token, on the cms host" "https://$CMS/admin/create-first-user" "$(printf '%s' "$UNLOCK" | awk 'tolower($1)=="location:"{print $2}')"
COOKIE="bento-setup=$SETUP"
check "form opens with the cookie" 200 "$(code $CMS /admin/create-first-user -H "Cookie: $COOKIE")"
FIRST="$(req $CMS /api/users/first-register -X POST -H 'content-type: application/json' -H "Cookie: $COOKIE" -d "$BODY")"
TOKEN="$(printf '%s' "$FIRST" | sed -nE 's/.*"token":"([^"]+)".*/\1/p')"
contains "first admin created" '"role":"admin"' "$FIRST"
check "second first-register refused, even with the link" 403 "$(code $CMS /api/users/first-register -X POST -H 'content-type: application/json' -H "Cookie: $COOKIE" -d "${BODY/gate-test/gate-test2}")"
AUTH="Authorization: JWT $TOKEN"
check "assistant says it is off without keys" '{"text":false,"image":false}' "$(req $CMS /api/assistant/status -H "$AUTH")"
check "assistant refuses without a key" 503 "$(code $CMS /api/assistant/text -X POST -H "$AUTH" -H 'content-type: application/json' -d '{"action":"titles","title":"x"}')"

echo "== content, as the admin would create it"
api() { req $CMS "$1" -X POST -H "$AUTH" -H 'content-type: application/json' -d "$2"; }
idof() { sed -nE 's/.*"doc":\{[^}]*"id":([0-9]+).*/\1/p' | head -1; }
CAT="$(api /api/categories '{"name":"Test","slug":"test","tone":"teal"}' | sed -nE 's/.*"id":([0-9]+).*/\1/p' | head -1)"
AUT="$(api /api/authors '{"name":"Auteur Test","slug":"auteur-test"}' | sed -nE 's/.*"id":([0-9]+).*/\1/p' | head -1)"
PNG=/tmp/bwtest.png
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d > "$PNG"
UP="$(req $CMS /api/media -X POST -H "$AUTH" -F 'file=@/tmp/bwtest.png;type=image/png' -F '_payload={"alt":"Test"}')"
MED="$(printf '%s' "$UP" | sed -nE 's/.*"doc":\{"id":([0-9]+).*/\1/p')"
[ -n "$MED" ] && echo "  ok    upload written to the volume by the non-root user (media $MED)" && pass=$((pass+1)) || { echo "  FAIL  upload: $UP" | cut -c1-300; fail=$((fail+1)); }
FILE="$(printf '%s' "$UP" | sed -nE 's/.*"filename":"([^"]+)".*/\1/p' | head -1)"
check "media served on the public host" 200 "$(code $PUB "/media/$FILE")"
contains "media cached as immutable" immutable "$(req $PUB "/media/$FILE" -D - -o /dev/null | tr -d '\r' | grep -i cache-control)"
LEX='{"root":{"type":"root","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"paragraph","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"text","version":1,"text":"Un paragraphe de test.","format":0,"detail":0,"mode":"normal","style":""}]}]}}'
post() { # title slug status
  printf '{"title":"%s","slug":"%s","excerpt":"Un chapo de test.","hero":%s,"body":%s,"category":%s,"authors":[%s],"_status":"%s","meta":{"title":"%s","description":"Une description de test assez longue pour passer la validation de relecture."}}' "$1" "$2" "$MED" "$LEX" "$CAT" "$AUT" "$3" "$1"
}
R1="$(api /api/posts "$(post 'Premier article' premier-article published)")"
contains "post published" '"_status":"published"' "$R1"
check "post page" 200 "$(code $PUB /blog/premier-article)"
req $PUB /blog -o /dev/null;
check "blog page cached" HIT "$(req $PUB /blog -D - -o /dev/null | tr -d '\r' | awk 'tolower($1)=="x-nextjs-cache:"{print $2}')"
contains "new post listed" 'Premier article' "$(req $PUB /blog)"
check "social card" 200 "$(code $PUB /blog/social-card/premier-article)"
check "rss" 200 "$(code $PUB /blog/rss.xml)"

echo "== publishing from the admin refreshes the page at once"
R2="$(api /api/posts "$(post 'Deuxieme article' deuxieme-article published)")"
contains "second post published" '"_status":"published"' "$R2"
sleep 2
contains "listed right after publishing" 'Deuxieme article' "$(req $PUB /blog)"

echo "== scheduled publishing (the item that could not be confirmed)"
R3="$(req $CMS '/api/posts?draft=true' -X POST -H "$AUTH" -H 'content-type: application/json' -d "$(post 'Article programme' article-programme draft)")"
SCHED="$(printf '%s' "$R3" | sed -nE 's/.*"doc":\{"id":([0-9]+).*/\1/p')"
USERID="$(docker exec "$N-db" psql -U postgres -d bento_web -Atc 'select id from users limit 1')"
contains "blog page warm and without the post" 'Deuxieme article' "$(req $PUB /blog)"
HIT="$(req $PUB /blog -D - -o /dev/null | tr -d '\r' | awk 'tolower($1)=="x-nextjs-cache:"{print $2}')"; echo "  cache before the job: $HIT"
req $PUB /blog | grep -q 'Article programme' && { echo "  FAIL  scheduled post visible too early"; fail=$((fail+1)); }
docker exec "$N-db" psql -U postgres -d bento_web -qc "insert into payload_jobs (input, task_slug, queue, wait_until, total_tried, has_error, processing, created_at, updated_at) values ('{\"type\":\"publish\",\"doc\":{\"relationTo\":\"posts\",\"value\":$SCHED},\"user\":{\"relationTo\":\"users\",\"value\":$USERID}}', 'schedulePublish', 'default', now(), 0, false, false, now(), now())"
T0=$(date +%s)
state=""
for i in $(seq 1 45); do
  state="$(docker exec "$N-db" psql -U postgres -d bento_web -Atc "select _status from posts where id=$SCHED")"
  [ "$state" = "published" ] && break
  sleep 2
done
echo "  job published the post after $(( $(date +%s) - T0 ))s"
check "scheduled post published by the job" published "$state"
check "ledger number given by the job" 3 "$(docker exec "$N-db" psql -U postgres -d bento_web -Atc "select entry_number from posts where id=$SCHED")"
seen=no; T1=$(date +%s)
for i in $(seq 1 10); do
  if req $PUB /blog | grep -q 'Article programme'; then seen="yes, $(( $(date +%s) - T1 ))s after publishing"; break; fi
  sleep 1
done
echo "  on the cached blog page: $seen"
check "blog page refreshed itself after the scheduled publish" yes "${seen%%,*}"
check "scheduled post page" 200 "$(code $PUB /blog/article-programme)"
docker logs "$N-web" 2>&1 | grep -c 'Could not refresh' | sed 's/^/  "Could not refresh" lines in the log: /'

echo "== every page, 600 requests (the dev-only intl error must not exist here)"
: > /tmp/bwtest.codes
for round in $(seq 1 60); do
  for p in /blog /blog/premier-article /blog/deuxieme-article /blog/article-programme /blog/category/test /blog/author/auteur-test /blog/rss.xml /sitemap.xml /robots.txt /blog/nope; do
    code $PUB "$p" >> /tmp/bwtest.codes; echo " $p" >> /tmp/bwtest.codes
  done
done
sort /tmp/bwtest.codes | uniq -c | sed 's/^/  /'
FIVE="$(grep -c '^5' /tmp/bwtest.codes)"
check "no 5xx in 600 requests" 0 "$FIVE"
LOGERR="$(docker logs "$N-web" 2>&1 | grep -ciE 'No intl context|⨯|unhandled')"
check "no server errors in the log" 0 "$LOGERR"

echo "== container state"
docker exec "$N-web" id -u | sed 's/^/  runs as uid /'
docker stats --no-stream --format '  memory {{.MemUsage}}' "$N-web"
echo "== last log lines"
docker logs "$N-web" 2>&1 | tail -6 | cut -c1-160 | sed 's/^/  /'
rm -f "$PNG" /tmp/bwtest.codes
echo "RESULT pass=$pass fail=$fail"
[ "$fail" -eq 0 ]

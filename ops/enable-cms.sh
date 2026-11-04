#!/usr/bin/env bash
# Run once, after the DNS record for cms.bento212.com exists. Turns on its HTTPS certificate and
# prints the private link that creates the first administrator.
#
# The certificate stays off until then because Traefik retries it on every container event, and each
# failure counts against Let's Encrypt's limits. This script refuses to run before DNS is right.
set -euo pipefail

CMS=cms.bento212.com
cd "$(dirname "${BASH_SOURCE[0]}")/.."

SERVER_IP="$(curl -4 -sS --max-time 10 https://api.ipify.org)"
DNS_IP="$(getent ahostsv4 "$CMS" | awk 'NR==1{print $1}')"
if [ "$DNS_IP" != "$SERVER_IP" ]; then
  echo "Not yet: $CMS points to '${DNS_IP:-nothing}', and this server is $SERVER_IP." >&2
  echo "Add the A record, wait a few minutes, then run this again." >&2
  exit 1
fi

sed -i '/^CMS_CERT_RESOLVER=/d' .env
WEB_IMAGE_TAG="$(docker inspect bento-web --format '{{.Config.Image}}' | cut -d: -f2)" \
  docker compose -p bento-web -f docker-compose.yml up -d --no-deps web >/dev/null

echo "Waiting for the certificate..."
for _ in $(seq 1 60); do
  if curl -sS --max-time 5 -o /dev/null "https://$CMS/admin/login" 2>/dev/null; then
    echo "https://$CMS is up with a valid certificate."
    echo "Open this once to create the first administrator:"
    echo "https://$CMS/admin/create-first-user?setup=$(grep '^SETUP_TOKEN=' .env | cut -d= -f2)"
    exit 0
  fi
  sleep 5
done

echo "No valid certificate after 5 minutes." >&2
echo "Let's Encrypt blocks a hostname for up to an hour after repeated failures, so try again later." >&2
docker logs --since 10m traefik 2>&1 | grep "$CMS" | tail -3 >&2 || true
exit 1

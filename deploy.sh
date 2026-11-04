#!/usr/bin/env bash
# Deploy script for bento-web, invoked over SSH by the GitHub Actions deploy key.
# Same design as bento-crm's: fast-forwards the checkout, pulls the image tag GHCR just
# pushed, recreates the container, then health-checks it. Environment-agnostic: the same
# script runs in /srv/bento/apps/bento-web (main) and /srv/bento/apps/bento-web-dev (dev).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.yml}"
PROJECT="$(basename "$APP_DIR")"
SERVICE="web"
IMAGE_TAG="${1:?usage: deploy.sh <image-tag> (reads GHCR_LOGIN_TOKEN from env)}"

cd "$APP_DIR"

dc() { docker compose -p "$PROJECT" -f "$COMPOSE_FILE" "$@"; }

# Assumes a PUBLIC repo, like bento-crm: the pull needs no credentials. The HTTP/1.1 pin
# works around the box's git + curl 401ing git-upload-pack over HTTP/2. If this repo is
# ever private, the checkout needs a deploy key and this pattern must go.
git_pub() {
  GIT_TERMINAL_PROMPT=0 git \
    -c http.version=HTTP/1.1 \
    -c credential.helper= \
    -c 'http.https://github.com/.extraheader=' \
    "$@"
}
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git_pub fetch --quiet origin "$BRANCH"
git_pub merge --ff-only --quiet "origin/$BRANCH"

if [ -n "${GHCR_LOGIN_TOKEN:-}" ]; then
  echo "$GHCR_LOGIN_TOKEN" | docker login ghcr.io -u "${GHCR_LOGIN_USER:-github-actions}" --password-stdin
fi

export WEB_IMAGE_TAG="$IMAGE_TAG"
dc pull "$SERVICE"
dc up -d --remove-orphans "$SERVICE"

CONTAINER="$(dc ps -q "$SERVICE")"
if [ -z "$CONTAINER" ]; then
  echo "ERROR: could not resolve the '$SERVICE' container for project '$PROJECT'" >&2
  dc ps >&2
  exit 1
fi

# Migrations run when the app boots, so a new schema can take a moment.
echo "Waiting for $PROJECT/$SERVICE ($CONTAINER) to become healthy..."
for i in $(seq 1 90); do
  if docker exec "$CONTAINER" wget -qO- http://127.0.0.1:3000/healthz >/dev/null 2>&1; then
    echo "$PROJECT/$SERVICE is healthy after ${i}s"
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "ERROR: $PROJECT/$SERVICE did not become healthy within 90s after deploy" >&2
docker logs "$CONTAINER" --tail 50 >&2
exit 1

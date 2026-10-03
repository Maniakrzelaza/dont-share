#!/usr/bin/env bash
#
# Don't Share — deploy one release.
#
# Runs on the server, invoked by the pipeline over SSH after the deploy/ directory has been
# shipped here. Takes the image reference to run, so the server never decides which version is
# current — the pipeline does.
#
# Usage:
#   ./deploy.sh <web-image>
#
# From the environment:
#   DS_DOMAIN                                         domain the edge serves (required)
#   DS_REGISTRY_USER, DS_REGISTRY_PASSWORD, DS_REGISTRY_HOST   registry credentials, when the image is private

set -euo pipefail

APP_DIR="/opt/dontshare"
HEALTH_URL="http://127.0.0.1:8080/"

log() { printf '\n== %s\n' "$1"; }
die() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }

WEB_IMAGE="${1:-}"
[[ -n "$WEB_IMAGE" ]] || die "pass the web image reference as the first argument"
DOMAIN="${DS_DOMAIN:-}"
[[ -n "$DOMAIN" ]] || die "DS_DOMAIN is missing — set the DS_DOMAIN variable in the GitHub environment"

# The tag is the commit SHA, and the image writes that SHA into the page it serves. Checking for it
# rather than for any 200 is what tells the new release apart from the old one still answering.
EXPECTED_SHA="${WEB_IMAGE##*:}"
MARKER="name=\"ds-build\" content=\"$EXPECTED_SHA\""

cd "$APP_DIR" || die "missing $APP_DIR — run bootstrap.sh on this host first"
[[ -f docker-compose.yml ]] || die "no docker-compose.yml in $APP_DIR — the pipeline ships it before deploying"

SIGNED_IN=0
if [[ -n "${DS_REGISTRY_USER:-}" ]]; then
	log "Registry sign-in"
	printf '%s' "${DS_REGISTRY_PASSWORD:?DS_REGISTRY_PASSWORD is missing}" |
		docker login "${DS_REGISTRY_HOST:-ghcr.io}" \
			--username "$DS_REGISTRY_USER" --password-stdin >/dev/null
	SIGNED_IN=1
else
	echo "No registry credentials supplied — assuming the image is public"
fi

# Read before .env is overwritten below — .env is where the tag actually comes from, so reading it
# afterwards would report the release we are in the middle of deploying as "previous".
PREVIOUS="$(docker compose config --images 2>/dev/null | tr '\n' ' ' || true)"

log "Release web=$WEB_IMAGE domain=$DOMAIN"
# The image reference lives in .env rather than in the compose file, so a rollback is a matter of
# passing an earlier tag — no repository change required.
{
	printf 'DS_WEB_IMAGE=%s\n' "$WEB_IMAGE"
	printf 'DS_DOMAIN=%s\n' "$DOMAIN"
} >.env

log "Pulling images"
# A failed pull is almost always an authentication problem, and docker's "denied" says nothing
# about which credential was missing. Name the likely cause instead.
if ! docker compose pull --quiet; then
	if [[ $SIGNED_IN -eq 0 ]]; then
		printf '\nThe image could not be pulled and no registry credentials were supplied.\n' >&2
		printf 'Either make the package public on GitHub or let the pipeline pass DS_REGISTRY_USER.\n' >&2
	else
		printf '\nThe image could not be pulled even though sign-in as %s succeeded.\n' "$DS_REGISTRY_USER" >&2
		printf 'Check that the token can read packages and that the tag exists.\n' >&2
	fi
	die "image pull failed"
fi

log "Starting"
docker compose up -d --remove-orphans

log "Health check"
HEALTHY=0
for _ in $(seq 1 30); do
	if curl -fsS --max-time 2 "$HEALTH_URL" 2>/dev/null | grep -qF "$MARKER"; then
		HEALTHY=1
		break
	fi
	sleep 1
done

if [[ $HEALTHY -ne 1 ]]; then
	printf '\nThe new release does not answer on %s with build %s.\n' "$HEALTH_URL" "$EXPECTED_SHA" >&2
	printf 'Previous images were: %s\n' "${PREVIOUS:-unknown}" >&2
	docker compose logs --tail 50 web >&2 || true
	die "deployment failed the health check"
fi

log "Edge health check (through Caddy)"
# The check above proves the container answers on its loopback port. Visitors come through Caddy,
# so a routing or certificate mistake in deploy/Caddyfile is invisible until we look at that path.
#
# --resolve rather than a Host header on a bare IP: an IP in the URL sends no server name during
# the TLS handshake, and that name is how Caddy picks a certificate. Verification stays off — the
# caller is the host itself, and on a machine where ACME has not issued yet a strict check would
# fail for a reason this check does not exist to catch.
CURL_EDGE=(curl -sk --max-time 5 --resolve "$DOMAIN:443:127.0.0.1")
BASE="https://$DOMAIN"

edge_failed() {
	printf '\n%s\n' "$1" >&2
	printf 'curl, this time explaining itself:\n' >&2
	curl -sS --max-time 5 --resolve "$DOMAIN:443:127.0.0.1" -o /dev/null "$2" >&2 || true
	printf 'If DNS for %s does not point at this machine yet, Caddy has no certificate and this check cannot pass.\n' "$DOMAIN" >&2
	docker compose logs --tail 50 caddy >&2 || true
	die "deployment failed the edge health check"
}

# `|| true` everywhere: under `set -e` a failing curl inside $(...) would end the script silently,
# throwing away the message written underneath it.
EDGE_HEALTHY=0
for _ in $(seq 1 15); do
	if "${CURL_EDGE[@]}" "$BASE/" 2>/dev/null | grep -qF "$MARKER"; then
		EDGE_HEALTHY=1
		break
	fi
	sleep 1
done
[[ $EDGE_HEALTHY -eq 1 ]] || edge_failed "$BASE/ did not serve build $EXPECTED_SHA through Caddy." "$BASE/"

# The title image is what link previews fetch. A 200 alone is not enough — a misrouted path could
# answer with HTML — so the content type is checked too.
IMAGE_ANSWER="$("${CURL_EDGE[@]}" -o /dev/null -w '%{http_code} %{content_type}' "$BASE/dontshare.png" || true)"
[[ "$IMAGE_ANSWER" == "200 image/png"* ]] ||
	edge_failed "/dontshare.png answered \"$IMAGE_ANSWER\" through Caddy, expected 200 image/png." "$BASE/dontshare.png"

log "Cleaning up unused images"
docker image prune -f --filter "until=168h" >/dev/null || true

log "Deployed: web=$WEB_IMAGE at https://$DOMAIN"

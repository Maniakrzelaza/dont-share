#!/usr/bin/env bash
#
# Forced-command gate for the deployment key.
#
# The key in authorized_keys points here, so whatever the pipeline asks for, this script decides
# what actually runs. Two things are allowed: rsync in server mode (used to ship the deploy/
# directory) and the deploy script. Everything else is refused, which means a leaked deployment
# key grants the ability to deploy rather than a shell on the host.
#
# bootstrap.sh installs this file to /usr/local/bin/ds-ssh-entry.sh, owned by root and outside the
# directory the deployment user can write to. A gate the gated party can rewrite is not a gate.
#
# The deploy script is invoked through `bash` rather than executed directly, so a missing execute
# bit — permissions do not always survive a trip through a repository and rsync — cannot break a
# deployment.

set -euo pipefail

APP_DIR="/opt/dontshare"
COMMAND="${SSH_ORIGINAL_COMMAND:-}"

# The pipeline prefixes the command with registry credentials and the domain, so the gate has to
# accept leading assignments. Only these names are allowed, and only in NAME=value form: accepting
# arbitrary assignments would let a caller set PATH or LD_PRELOAD and turn the gate into a shell.
# The domain is limited to the characters a hostname can have, because it ends up in Caddy's config.
REST="$COMMAND"
ALLOWED_ENV=()
while [[ "$REST" =~ ^((DS_REGISTRY_(HOST|USER|PASSWORD)=[^[:space:]]*)|(DS_DOMAIN=[a-z0-9.-]+))[[:space:]]+(.*)$ ]]; do
	ALLOWED_ENV+=("${BASH_REMATCH[1]}")
	REST="${BASH_REMATCH[5]}"
done

case "$REST" in
	"rsync --server "*" $APP_DIR/"* | "rsync --server "*" $APP_DIR")
		exec $REST
		;;
	"$APP_DIR/deploy.sh "*)
		exec env ${ALLOWED_ENV[@]+"${ALLOWED_ENV[@]}"} \
			bash "$APP_DIR/deploy.sh" ${REST#"$APP_DIR/deploy.sh "}
		;;
	*)
		printf 'refused: this key may only run rsync into %s or %s/deploy.sh\n' \
			"$APP_DIR" "$APP_DIR" >&2
		# The command is not echoed back: it may carry the registry token.
		exit 1
		;;
esac

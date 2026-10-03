#!/usr/bin/env bash
#
# Don't Share — provision a fresh host.
#
# Turns a clean Debian or Ubuntu machine into a host ready to accept deployments. The script is
# idempotent: run it as many times as you like and the server ends up in the same state. That is
# what makes the host disposable — rebuilding after an incident or moving to another provider is
# one command instead of guessing what was once done by hand.
#
# Usage, as root on a fresh machine:
#   bash bootstrap.sh "ssh-ed25519 AAAA... deploy@github"
#
# The argument is the public key the pipeline will authenticate with. Without it the script stops,
# because a host that does not know that key cannot accept any deployment.

set -euo pipefail

DEPLOY_USER="ds"
APP_DIR="/opt/dontshare"

log() { printf '\n== %s\n' "$1"; }
die() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root"

DEPLOY_KEY="${1:-}"
[[ -n "$DEPLOY_KEY" ]] || die "pass the deployment public key as the first argument"
[[ "$DEPLOY_KEY" == ssh-* ]] || die "the first argument does not look like an SSH public key"

command -v apt-get >/dev/null || die "this script supports Debian and Ubuntu only"

log "Base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg rsync ufw >/dev/null

log "Docker Engine and the compose plugin"
if ! command -v docker >/dev/null; then
	DISTRO="$(. /etc/os-release && echo "$ID")"
	CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"

	install -m 0755 -d /etc/apt/keyrings
	curl -fsSL "https://download.docker.com/linux/$DISTRO/gpg" -o /etc/apt/keyrings/docker.asc
	chmod a+r /etc/apt/keyrings/docker.asc

	printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
		"$(dpkg --print-architecture)" "$DISTRO" "$CODENAME" >/etc/apt/sources.list.d/docker.list

	apt-get update -qq
	apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin \
		docker-compose-plugin >/dev/null
else
	echo "Docker already present — skipping installation"
fi

systemctl enable --now docker >/dev/null

log "Container log size limit"
# Without this, logs grow without bound and the disk fills up months later — a failure that looks
# like an application outage but is really a housekeeping outage.
if [[ ! -f /etc/docker/daemon.json ]]; then
	mkdir -p /etc/docker
	cat >/etc/docker/daemon.json <<-'EOF'
		{
		  "log-driver": "json-file",
		  "log-opts": { "max-size": "10m", "max-file": "3" }
		}
	EOF
	systemctl restart docker
fi

log "Deployment user: $DEPLOY_USER"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
	useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

log "Application directory: $APP_DIR"
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

log "Entry-point gate"
# The gate lives outside the directory the deployment user can write to, owned by root. When it
# sat inside /opt/dontshare, the rsync it was gating could overwrite it — a gate the gated party can
# rewrite is not a gate. The script is shipped next to this one; bootstrap only installs it.
GATE="/usr/local/bin/ds-ssh-entry.sh"
GATE_SOURCE="$(dirname "$(readlink -f "$0")")/ssh-entry.sh"
[[ -f "$GATE_SOURCE" ]] || die "ssh-entry.sh not found next to bootstrap.sh — copy both files over"
install -o root -g root -m 0755 "$GATE_SOURCE" "$GATE"

# Older installs kept the gate inside the application directory. Remove it so nothing points there.
rm -f "$APP_DIR/ssh-entry.sh"

log "Deployment key, restricted to that gate"
# A leak of this key out of the pipeline grants the ability to deploy, not a shell on the server.
SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$SSH_DIR"
touch "$SSH_DIR/authorized_keys"

KEY_BODY="$(awk '{print $2}' <<<"$DEPLOY_KEY")"
# Drop any previous entry for this key so the restrictions are always the current ones.
grep -vF "$KEY_BODY" "$SSH_DIR/authorized_keys" >"$SSH_DIR/authorized_keys.new" || true
mv "$SSH_DIR/authorized_keys.new" "$SSH_DIR/authorized_keys"
printf 'command="%s",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding %s\n' \
	"$GATE" "$DEPLOY_KEY" >>"$SSH_DIR/authorized_keys"

chmod 700 "$SSH_DIR"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"

log "SSH hardening"
# Password authentication on a public host is the most attacked door on the internet: bots hammer
# it around the clock. With key-based access in place there is no reason to leave it open.
#
# The guard below matters more than the change itself. Refusing to disable passwords when root has
# no usable key is the difference between hardening a server and locking yourself out of it.
ROOT_KEYS="/root/.ssh/authorized_keys"
if [[ -s "$ROOT_KEYS" ]] && grep -q '^ssh-' "$ROOT_KEYS"; then
	# A drop-in file rather than edits to sshd_config: idempotent, and it survives package
	# upgrades that rewrite the main configuration.
	cat >/etc/ssh/sshd_config.d/10-dontshare.conf <<-'EOF'
		# Managed by deploy/bootstrap.sh — do not edit by hand.
		PasswordAuthentication no
		KbdInteractiveAuthentication no
		# Root stays reachable with a key, for maintenance. Passwords do not.
		PermitRootLogin prohibit-password
	EOF

	# Never reload a configuration that does not parse — that is how servers become unreachable.
	if sshd -t 2>/dev/null; then
		systemctl reload ssh 2>/dev/null || systemctl reload sshd
		echo "Password authentication disabled; root may still log in with a key"
	else
		rm -f /etc/ssh/sshd_config.d/10-dontshare.conf
		echo "WARNING: the hardened SSH configuration did not validate — reverted, nothing changed" >&2
	fi
else
	cat >&2 <<-EOF

		WARNING: password authentication left ENABLED.
		Reason: no usable public key found in $ROOT_KEYS, so disabling passwords could lock you
		out of this host. Add your key for root, then run this script again.
	EOF
fi

log "Firewall"
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

log "Done"
cat <<-EOF

	Host provisioned.

	  deployment user   : $DEPLOY_USER
	  application dir   : $APP_DIR
	  entry-point gate  : $GATE (root-owned, outside $APP_DIR)
	  open ports        : 22, 80, 443
	  docker            : $(docker --version | cut -d, -f1)
	  compose           : $(docker compose version --short)
	  password auth     : $(grep -q 'PasswordAuthentication no' /etc/ssh/sshd_config.d/10-dontshare.conf 2>/dev/null && echo "disabled" || echo "ENABLED - see the warning above")

	What this script deliberately does NOT do:
	  * it does not copy application configuration — the pipeline ships it on every release,
	  * it does not log in to any image registry — the deploy script does, with pipeline credentials,
	  * it holds no secret of any kind.

	Next step: push to main on GitHub.
EOF

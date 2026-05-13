#!/usr/bin/env bash
# Attiva Cloudflare Email Routing su arsolving.it e crea regola
# info@arsolving.it -> arsolving@gmail.com
set -u
: "${CF_TOKEN:?CF_TOKEN richiesto}"
ZONE="1c6559b851e3d0bcd26ecca0218b486a"
ACCOUNT="1211ce800c743d1d1642e59c1d910eaf"
DEST="arsolving@gmail.com"
LOG="${LOG:-/tmp/cf_email.log}"
: > "$LOG"

api_post()  { curl -s -m 15 -X POST  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$@"; }
api_get()   { curl -s -m 15          -H "Authorization: Bearer $CF_TOKEN" "$@"; }

echo "=== 1) Enable Email Routing on zone ===" >> "$LOG"
api_post "https://api.cloudflare.com/client/v4/zones/$ZONE/email/routing/enable" >> "$LOG"
echo >> "$LOG"

echo "=== 2) Apply DNS records (MX/TXT for routing) ===" >> "$LOG"
api_post "https://api.cloudflare.com/client/v4/zones/$ZONE/email/routing/dns" >> "$LOG"
echo >> "$LOG"

echo "=== 3) Create destination address (will trigger verification email) ===" >> "$LOG"
api_post "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/email/routing/addresses" \
  --data "{\"email\":\"$DEST\"}" >> "$LOG"
echo >> "$LOG"

echo "=== 4) Status routing ===" >> "$LOG"
api_get "https://api.cloudflare.com/client/v4/zones/$ZONE/email/routing" >> "$LOG"
echo >> "$LOG"

echo "=== 5) List destinations ===" >> "$LOG"
api_get "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/email/routing/addresses" >> "$LOG"
echo >> "$LOG"

echo "=== 6) Create forwarding rule info@arsolving.it -> $DEST ===" >> "$LOG"
api_post "https://api.cloudflare.com/client/v4/zones/$ZONE/email/routing/rules" \
  --data "{\"name\":\"Forward info to gmail\",\"enabled\":true,\"priority\":1,\"matchers\":[{\"type\":\"literal\",\"field\":\"to\",\"value\":\"info@arsolving.it\"}],\"actions\":[{\"type\":\"forward\",\"value\":[\"$DEST\"]}]}" >> "$LOG"
echo >> "$LOG"

echo "=== 7) Create catch-all rule (everything else -> $DEST) ===" >> "$LOG"
api_post "https://api.cloudflare.com/client/v4/zones/$ZONE/email/routing/rules/catch_all" \
  -X PUT \
  --data "{\"name\":\"Catch-all to gmail\",\"enabled\":true,\"matchers\":[{\"type\":\"all\"}],\"actions\":[{\"type\":\"forward\",\"value\":[\"$DEST\"]}]}" >> "$LOG"
echo >> "$LOG"

echo "=== DONE ===" >> "$LOG"

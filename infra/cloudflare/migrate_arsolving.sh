#!/usr/bin/env bash
# Migrazione DNS arsolving.it: ripulisce import auto Cloudflare e
# imposta solo i record realmente necessari (CloudFront + SendGrid + ACM).
# Uso interno. Tutte le credenziali vengono passate da env.
set -u
: "${CF_TOKEN:?CF_TOKEN richiesto}"
ZONE="1c6559b851e3d0bcd26ecca0218b486a"
LOG="${LOG:-/tmp/cf_migrate.log}"
: > "$LOG"

api()       { curl -s -m 15 -H "Authorization: Bearer $CF_TOKEN" "$@"; }
api_post()  { curl -s -m 15 -X POST   -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$@"; }
api_patch() { curl -s -m 15 -X PATCH  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$@"; }
api_del()   { curl -s -m 15 -X DELETE -H "Authorization: Bearer $CF_TOKEN" "$@"; }

DELETE_IDS=(
  f18690843fe93f5ec19534e6c232c547 ad8cd31b9fc1b418cad3ede8e1a2c10d
  7c5d0af794f1c1a09823b8002356c96d d5f623283751fcd057b9c085a1773fe1
  c1d4b5dd790a1dc29a0e4720c48326fb 103e93b67807d8ef98597b6c6c2d6b35
  1a9c6a3bc292d68c61d2aca24fd5e904 dfb3802c9b2514ace22b0cf9e4c8d1af
  340848418df192f00491fa69edfe8169 f013d71b150ec931d7a7b40d60fe0538
  683774ca43bf9caa025f6952b840555c 2625af2082ae3c135e29771390adc39f
  14027a01f3fe7861f83589e8260cb78f 155a92d21584c0ab2a662fb2eddfa981
  bfb34b88d3891043486fbdafa88507d2 3d12902e200d426387b58457b5989d54
  3e64e6fa34a2cf402634219ccfceb5d9 88b93265503f84e3eb6948ddeb51a1ad
  b1b1a6f003154c9c7c3b909918a2aeb0 3b28a3d17402a89ad3f0830a37d5ddee
  f08dd8e23d71dad6fa8ed539d07e57dd 073fa1a038cc1fc177f216dd74174158
  19e4c527223726979d3418ed83bb6e6c c36fef903e10a384901287539ab27e0f
  4b13aba70b0c57ee548721349a001c1a 934465f09207207e38dfbee1638a5c34
  e4c45349c19104e36e22b11f720da174
)

echo "=== DELETE ${#DELETE_IDS[@]} record ===" >> "$LOG"
for ID in "${DELETE_IDS[@]}"; do
  echo "[DEL $ID]" >> "$LOG"
  api_del "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/$ID" >> "$LOG"
  echo >> "$LOG"
done

echo "=== PATCH SPF ===" >> "$LOG"
api_patch "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/0d3958586d2f33caba7ea47da9fb93b7" \
  --data '{"content":"v=spf1 include:sendgrid.net include:_spf.mx.cloudflare.net ~all"}' >> "$LOG"
echo >> "$LOG"

echo "=== PATCH DKIM s1 (no proxy) ===" >> "$LOG"
api_patch "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/dd9f8b8a8ccb4827d6a3483bee9b006f" \
  --data '{"proxied":false}' >> "$LOG"
echo >> "$LOG"

echo "=== PATCH DKIM s2 (no proxy) ===" >> "$LOG"
api_patch "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/9f135f3bb907154255e01177ebe3de4b" \
  --data '{"proxied":false}' >> "$LOG"
echo >> "$LOG"

echo "=== CREATE nuovi record ===" >> "$LOG"
CREATES=(
  '{"type":"CNAME","name":"arsolving.it","content":"d3los48y3l90pg.cloudfront.net","ttl":1,"proxied":false,"comment":"CloudFront apex (CF flattens to A/AAAA)"}'
  '{"type":"CNAME","name":"www","content":"d3los48y3l90pg.cloudfront.net","ttl":1,"proxied":false,"comment":"CloudFront www"}'
  '{"type":"CNAME","name":"em","content":"u106682332.wl083.sendgrid.net","ttl":1,"proxied":false,"comment":"SendGrid return-path"}'
  '{"type":"CNAME","name":"_f284839b81efd70ec935959450b053eb","content":"_56fde25c47e8dba4bd0c68b757e5a3b9.jkddzztszm.acm-validations.aws","ttl":1,"proxied":false,"comment":"ACM validation apex"}'
  '{"type":"CNAME","name":"_99e5dc63e23ebc273a2e77c4caf6c5f9.www","content":"_ed1454da284d4a9c7d31b389856d2cc5.jkddzztszm.acm-validations.aws","ttl":1,"proxied":false,"comment":"ACM validation www"}'
)
for D in "${CREATES[@]}"; do
  echo "[POST] $D" >> "$LOG"
  api_post "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" --data "$D" >> "$LOG"
  echo >> "$LOG"
done

echo "=== DONE ===" >> "$LOG"

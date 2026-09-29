#!/bin/sh

if [ -z "$SENTRY_CLIENT_DSN" ] || [ -z "$SENTRY_AUTH_TOKEN" ]; then
  exit 0
fi

skip() {
  echo "Source map upload skipped: $1" >&2
  exit 0
}

[ -d build/sourcemaps ] || skip "this build has no source maps."
[ -n "$SENTRY_ORG" ] || skip "SENTRY_ORG is not set."
[ -n "$SENTRY_CLIENT_PROJECT" ] || skip "SENTRY_CLIENT_PROJECT is not set."

SENTRY_URL=$(echo "$SENTRY_CLIENT_DSN" | sed -E 's#^([a-z]+://)[^@]*@(.*)/[^/]*$#\1\2#')
export SENTRY_URL
export SENTRY_DISABLE_UPDATE_CHECK=true

./node_modules/.bin/sentry-cli sourcemaps upload \
  --project "$SENTRY_CLIENT_PROJECT" \
  ${SOURCE_COMMIT:+--release "$SOURCE_COMMIT"} \
  build/sourcemaps >/dev/null ||
  skip "sentry-cli failed, browser stack traces stay minified."

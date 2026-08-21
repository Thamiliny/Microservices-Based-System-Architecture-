# =============================================================================
# Food Delivery System - Backend API image
#
# Multi-stage build:
#   deps    - installs production dependencies only, from the lockfile
#   runtime - slim final image that runs as an unprivileged user
# =============================================================================

# --- stage 1: dependencies ---------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Optional corporate / proxy CA certificates. The directory normally contains
# only .gitkeep, so this is a no-op on a standard machine; when a *.crt file is
# present it is appended to the system trust store so `npm ci` can run behind a
# TLS-inspecting proxy.
COPY docker/ca/ /tmp/extra-ca/
RUN for f in /tmp/extra-ca/*.crt; do \
      [ -e "$f" ] && cat "$f" >> /etc/ssl/certs/ca-certificates.crt; \
    done; true
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- stage 2: runtime --------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/src ./src
COPY backend/healthcheck.js ./healthcheck.js

# Run as the unprivileged `node` user that ships with the base image.
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Probe uses only the Node standard library - no curl/wget needed in the image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "healthcheck.js"]

CMD ["node", "src/server.js"]

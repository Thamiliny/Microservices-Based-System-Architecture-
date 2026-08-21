# =============================================================================
# Food Delivery System - Frontend image
#
#   build   - compiles the React application with Vite
#   runtime - serves the static bundle with nginx and reverse-proxies /api
#             to the backend container
# =============================================================================

# --- stage 1: build ----------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Optional corporate / proxy CA certificates (no-op when docker/ca is empty).
COPY docker/ca/ /tmp/extra-ca/
RUN for f in /tmp/extra-ca/*.crt; do \
      [ -e "$f" ] && cat "$f" >> /etc/ssl/certs/ca-certificates.crt; \
    done; true
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- stage 2: runtime --------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA + reverse-proxy configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Compiled static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# busybox wget ships with the nginx:alpine image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

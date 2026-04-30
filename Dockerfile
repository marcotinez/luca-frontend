FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES=20
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES=${NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES}
ENV NODE_ENV=production

RUN if [ -z "$NEXT_PUBLIC_API_URL" ]; then \
      echo "ERROR: NEXT_PUBLIC_API_URL is required at build time"; exit 1; \
    fi
RUN if echo "$NEXT_PUBLIC_API_URL" | grep -Eq '^http://(localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]+)?(/.*)?$'; then \
      echo "Using local HTTP API URL for local build: $NEXT_PUBLIC_API_URL"; \
    elif ! echo "$NEXT_PUBLIC_API_URL" | grep -Eq '^https://'; then \
      echo "ERROR: NEXT_PUBLIC_API_URL must start with https:// in non-local builds. Got: $NEXT_PUBLIC_API_URL"; exit 1; \
    fi

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]

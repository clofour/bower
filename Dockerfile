FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgres://canopy:canopy@localhost:5432/canopy
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 canopy && adduser --system --uid 1001 --ingroup canopy canopy
COPY --from=builder --chown=canopy:canopy /app/public ./public
COPY --from=builder --chown=canopy:canopy /app/.next/standalone ./
COPY --from=builder --chown=canopy:canopy /app/.next/static ./.next/static

USER canopy
EXPOSE 3000
CMD ["node", "server.js"]

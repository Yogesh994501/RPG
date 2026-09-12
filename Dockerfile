# Multi-stage Dockerfile for ChronoSlayer
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/ ./backend/
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

ENV PORT=5000
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/chronoslayer.db

EXPOSE 5000
VOLUME ["/data"]

CMD ["node", "backend/dist/server.js"]

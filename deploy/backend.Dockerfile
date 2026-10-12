# Сервис API: Node запускает TypeScript сам, сборка не нужна.
# Контекст сборки -- корень репо: API берёт общие с сайтом типы из src/shared.

FROM node:26.11.1-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# В dependencies только то, что нужно API: Astro и линтеры живут в devDependencies.
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error
COPY src/shared ./src/shared
COPY src/backend ./src/backend
USER node
EXPOSE 8787
CMD ["node", "src/backend/server.ts"]

# Budowany z katalogu głównego repo: docker build -f apps/server/Dockerfile .

FROM node:26-slim AS build
WORKDIR /repo
ENV HUSKY=0

# Najpierw same manifesty, żeby warstwa z zależnościami była cache'owana.
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/game-core/package.json packages/game-core/
COPY packages/protocol/package.json packages/protocol/
RUN node .yarn/releases/yarn-*.cjs install --immutable

COPY . .
RUN node .yarn/releases/yarn-*.cjs workspace @tetris/web build \
 && node .yarn/releases/yarn-*.cjs workspace @tetris/server build

# Obraz wynikowy: sam Node, bundle serwera (z zależnościami) i zbudowany frontend.
FROM node:26-slim
WORKDIR /app
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/public \
    APP_VERSION=${APP_VERSION}

COPY --from=build /repo/apps/server/dist/ ./
COPY --from=build /repo/apps/web/dist/ ./public/

USER node
EXPOSE 3000
CMD ["node", "--enable-source-maps", "main.cjs"]

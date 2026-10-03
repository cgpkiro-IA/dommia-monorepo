FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config-typescript/package.json packages/config-typescript/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared-types packages/shared-types
COPY packages/config-typescript packages/config-typescript

RUN pnpm --filter @dommia/shared-types build
RUN pnpm --filter @dommia/api build
RUN pnpm deploy --filter @dommia/api --prod /runtime

FROM node:22-alpine AS runtime

ENV NODE_ENV=development
ENV PORT=4000
WORKDIR /app

COPY --from=build /runtime/ ./
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/email-logo.png ./email-logo.png

EXPOSE 4000

CMD ["node", "dist/main.js"]

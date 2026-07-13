FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY services/order-svc/package.json ./services/order-svc/
COPY services/order-svc/tsconfig.json ./services/order-svc/
COPY services/order-svc/src ./services/order-svc/src
    

RUN npm install
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma
RUN cd packages/db && npm run build
RUN cd packages/shared && npm run build || true
RUN cd services/order-svc && npm run build

EXPOSE 4002

CMD ["node", "services/order-svc/dist/index.js"]
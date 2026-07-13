FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY services/report-svc ./services/report-svc

RUN npm install
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma
RUN cd packages/db && npm run build
RUN cd packages/shared && npm run build || true
RUN cd services/report-svc && npm run build

EXPOSE 4003

CMD ["node", "services/report-svc/dist/index.js"]
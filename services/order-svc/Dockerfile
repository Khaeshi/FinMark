FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY services/order-svc ./services/order-svc

RUN npm install
RUN cd packages/db && npx prisma generate
RUN cd packages/shared && npm run build || true
RUN cd services/order-svc && npm run build

EXPOSE 4002

CMD ["node", "services/order-svc/dist/index.js"]

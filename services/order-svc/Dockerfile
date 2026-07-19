FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --include=dev
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build -w @finmark/shared
RUN npm run build -w @finmark/db
RUN npm run build -w @finmark/aws
RUN npm run build -w @finmark/order-svc

ENV NODE_ENV=production

EXPOSE 4002

CMD ["node", "services/order-svc/dist/index.js"]

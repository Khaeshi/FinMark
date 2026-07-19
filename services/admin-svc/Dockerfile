FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --include=dev
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build -w @finmark/shared
RUN npm run build -w @finmark/db
RUN npm run build -w @finmark/admin-svc

ENV NODE_ENV=production

EXPOSE 4005

CMD ["node", "services/admin-svc/dist/index.js"]

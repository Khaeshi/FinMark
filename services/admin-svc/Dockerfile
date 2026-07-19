FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --include=dev
ENV DATABASE_URL="postgresql://build:build@localhost:5432/finmark"
RUN npm run db:generate -w @finmark/db
RUN npm run build -w @finmark/shared
RUN npm run build -w @finmark/db
RUN npm run build -w @finmark/admin-svc

ENV NODE_ENV=production

EXPOSE 4005

CMD ["node", "services/admin-svc/dist/index.js"]

FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --include=dev
ENV DATABASE_URL="postgresql://build:build@localhost:5432/finmark"
RUN npm run db:generate -w @finmark/db
RUN npm run build -w @finmark/shared
RUN npm run build -w @finmark/db
RUN npm run build -w @finmark/aws
RUN npm run build -w @finmark/user-auth-svc

ENV NODE_ENV=production

EXPOSE 4001

CMD ["node", "services/user-auth-svc/dist/index.js"]

FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci --include=dev
RUN npm run build -w @finmark/shared
RUN npm run build -w @finmark/api-gateway

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "services/api-gateway/dist/index.js"]

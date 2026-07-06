FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY services/admin-svc ./services/admin-svc

RUN npm install
RUN cd packages/db && npx prisma generate
RUN cd packages/shared && npm run build || true
RUN cd services/admin-svc && npm run build

EXPOSE 4005

CMD ["node", "services/admin-svc/dist/index.js"]

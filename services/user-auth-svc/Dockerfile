FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY services/user-auth-svc ./services/user-auth-svc

RUN npm install
RUN cd packages/db && npx prisma generate
RUN cd packages/shared && npm run build || true
RUN cd services/user-auth-svc && npm run build

EXPOSE 4001

CMD ["node", "services/user-auth-svc/dist/index.js"]

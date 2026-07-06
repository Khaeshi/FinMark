FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws
COPY services/feedback-svc ./services/feedback-svc

RUN npm install
RUN cd packages/db && npx prisma generate
RUN cd packages/shared && npm run build || true
RUN cd services/feedback-svc && npm run build

EXPOSE 4006

CMD ["node", "services/feedback-svc/dist/index.js"]

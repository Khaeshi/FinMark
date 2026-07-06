FROM node:20-alpine

WORKDIR /app

# copy monorepo root files
COPY package.json package-lock.json turbo.json ./

# copy packages first (shared dependencies)
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/aws ./packages/aws

# copy the specific service
COPY services/api-gateway ./services/api-gateway

# install all dependencies
RUN npm install

# generate prisma client
RUN cd packages/db && npx prisma generate

# build shared package
RUN cd packages/shared && npm run build || true

# build the service
RUN cd services/api-gateway && npm run build

EXPOSE 4000

CMD ["node", "services/api-gateway/dist/index.js"]

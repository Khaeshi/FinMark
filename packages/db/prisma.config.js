require('dotenv/config')

const { defineConfig } = require('prisma/config')

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Placeholder for Docker build; Railway injects DATABASE_URL at runtime.
    url: process.env.DATABASE_URL ?? 'postgresql://build:build@localhost:5432/finmark',
  },
})

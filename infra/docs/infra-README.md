# infra/ — Infrastructure

Contains all infrastructure configuration for the FinMark platform including AWS resource definitions and local development Docker setup.

---

## Purpose

- Define and version-control all cloud infrastructure as code
- Provide a consistent local development environment via Docker Compose
- Ensure production and development environments stay aligned

---

## Contents

```
infra/
├── aws/                      Terraform configurations
│   ├── rds.tf                PostgreSQL RDS + read replica
│   ├── elasticache.tf        Redis ElastiCache cluster
│   ├── cognito.tf            User pool + app client
│   ├── sqs.tf                Message queues (orders, notifications)
│   ├── waf.tf                WAF rules + OWASP managed rules
│   └── cloudfront.tf         CDN distribution + edge caching
│
└── docker/
    ├── docker-compose.yml         local dev (PostgreSQL + Redis)
    └── docker-compose.test.yml    test environment
```

---

## Local Development with Docker

For local development you need PostgreSQL and Redis running. Docker Compose handles this:

```bash
# start local DB and Redis
docker compose -f infra/docker/docker-compose.yml up -d

# stop
docker compose -f infra/docker/docker-compose.yml down
```

After starting, set your `.env`:
```
DATABASE_URL=postgresql://finmark_user:password@localhost:5432/finmark_dev
REDIS_URL=redis://localhost:6379
```

Alternatively, use **Neon** (free serverless PostgreSQL) instead of local Docker for the database — ask Khaeshi for the connection string.

---

## AWS Architecture

The platform runs on AWS in the `ap-southeast-1` (Singapore) region — closest to the Philippine and SEA user base.

| Resource | Service | Notes |
|---|---|---|
| CDN | CloudFront | Edge caching, DDoS absorption |
| WAF | AWS WAF (future) + **app-layer WAF on API gateway (live now)** | Prototype/Railway: OWASP-style path/query/body checks in `services/api-gateway`. AWS WAF + CloudFront remain the production edge target when infra is applied. |
| Auth | Cognito | User pools, JWT, MFA |
| Database | RDS PostgreSQL | Primary + read replica |
| Cache | ElastiCache | Redis for dashboard and reports |
| Queues | SQS | Async service-to-service messaging |
| Encryption | KMS | Keys for DB and cache encryption |
| Secrets | Secrets Manager | No hardcoded credentials anywhere |

---

## Important Notes

- Infrastructure changes require Khael's review before merging
- Never commit real AWS credentials — use `.env` and AWS Secrets Manager
- The Terraform files are documentation and future deployment reference — not applied yet in prototype phase
- **Until CloudFront/AWS WAF is applied**, production-like deploys (e.g. Railway) rely on the **app-layer WAF** in `api-gateway` (`middleware/waf.ts`): path probes, SQLi/XSS in query & JSON body, optional `WAF_DENY_IPS`, Prometheus `waf_blocks_total`
- The `ap-southeast-1` region is intentional — all SME clients are in Southeast Asia

# Fetching Service - Optimization Strategies

## 1. Overview
This document outlines optimizations for the Fetching Service, covering **scheduling, job execution, API fetching, database storage, and API response times** to improve performance and scalability.

---

## 2. Optimizations by Component

| **Component**          | **Current Approach** | **Optimization** | **Benefit** |
|------------------------|---------------------|------------------|-------------|
| **Queue Scheduler** | Runs every 20 mins | Event-driven scheduling | Eliminates unnecessary cycles |
|  | Priority based on `fetchPeriod` | Adjust priority dynamically based on API failures, response times, and popularity | Ensures high-traffic products get faster updates |
|  | Jobs enqueued individually | Group jobs with similar execution times | Reduces queue processing overhead |
| **Worker Service** | Single-threaded execution | Deploy multiple worker instances | Increases throughput |
|  | Fixed resource allocation | Auto-scale workers based on queue size | Efficient resource utilization |
|  | Immediate retries on failure | Exponential backoff for retries | Prevents API rate-limit violations |
| **API Fetcher** | Sequential requests | Token bucket algorithm for rate-limit-aware concurrency | Maximizes API usage |
|  | Hardcoded 30 requests/min | Adaptive throttling based on response times | Prevents failures under peak load |
|  | Equal priority for all products | Prioritize fetching high-demand products | Ensures critical products stay updated |
|  | No caching | Use Redis for response caching | Reduces redundant API calls |
| **Database** | Normalized schema, indexed by `product_id` | Partition `slots` table by `start_date` | Speeds up lookups |
|  | Only `product_id` indexed | Add compound indexes on query columns | Faster query execution |
|  | Aggregations at query time | Precompute aggregations in a separate table | Faster analytics queries |
|  | Queries hit the primary DB | Use read replicas for GET requests | Handles read-heavy workloads efficiently |
| **API Response** | Every request queries the DB | Cache API responses in Redis | Reduces DB load, improves response time |
|  | API waits for DB queries | Use background jobs for async fetching | Keeps API responsive under load |
|  | REST API with fixed responses | Introduce GraphQL | Reduces over-fetching/under-fetching |

---


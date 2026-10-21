# Database Performance & Query Tuning Guide

Optimizing relational query latency is critical for ensuring sub-100 millisecond response times.

## 1. Indexing Strategies
Ensure all frequently queried foreign keys have B-tree indices. In PostgreSQL, examine the output of EXPLAIN ANALYZE before deploying schema migrations to production.

## 2. Connection Pooling
Never create ephemeral connections per HTTP request. Use connection poolers like PgBouncer to keep connection latency negligible and preserve database memory.

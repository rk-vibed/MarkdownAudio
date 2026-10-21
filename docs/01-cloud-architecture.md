# Cloud Microservices & Scalable Systems

Modern distributed systems require robust decoupling and reliable service contracts.

## Service Mesh & Ingress
All internal traffic between our Kubernetes (k8s) pods is mediated via a high-performance proxy mesh. We terminate TLS at our edge NGINX reverse proxies, while internal telemetry is streamed to Prometheus.

## Data Consistency Models
For transactional workloads, our primary datastore is PostgreSQL. Read-heavy analytical workloads use materialized views indexed by SQL queries, while cache invalidations are broadcast through event streams.

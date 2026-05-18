---
sidebar_position: 6
title: Conclusion
description: What you built, why it matters, extension challenges, and discussion questions
---

# Conclusion

:::tip[Activity Complete!]
From a blank Spring Initializr page to a fully operational fault-tolerant distributed system — in a single session.
:::

---

## What You Built

### `activity-server`

A production-quality REST API with a layered architecture:

| Layer | Class | Responsibility |
|---|---|---|
| Model | `Product.java` | JPA entity mapped to the `products` table |
| Repository | `ProductRepository.java` | Database access via Spring Data JPA |
| Service | `ProductService.java` | Interface defining the business contract |
| Service Impl | `ProductServiceImpl.java` | Business logic + thread-safe failure simulation |
| Controller | `ProductController.java` | HTTP endpoints for the product catalogue |
| Admin | `AdminController.java` | Failure injection and recovery endpoints |

### `activity-load-balancer`

A custom reverse proxy with a built-in circuit breaker engine:

| Class | Responsibility |
|---|---|
| `CircuitBreakerState.java` | Enum: CLOSED / OPEN / HALF_OPEN |
| `CircuitBreaker.java` | State machine with atomic, lock-free thread safety |
| `BackendInstance.java` | Per-instance state: health flag + circuit breaker |
| `LoadBalancer.java` | Round-robin selection, skipping unavailable instances |
| `HealthChecker.java` | Background health polling via Spring `@Scheduled` |
| `ProxyController.java` | HTTP forwarding using Java's built-in `HttpClient` |
| `StatusController.java` | Real-time observability dashboard at `/lb/status` |

---

## The Three Tests You Ran

| Test | What You Observed |
|---|---|
| **Baseline** | All three backends responded; all breakers `CLOSED`; load balancer distributed evenly |
| **Failure** | One backend failed; three failures tripped the breaker to `OPEN`; load balancer automatically excluded the failing instance |
| **Recovery** | Server recovered; breaker waited out the timeout; sent one probe; transitioned `HALF_OPEN → CLOSED`; full traffic restored automatically |

---

## The Concepts Behind the Code

### Why `volatile` in ProductServiceImpl

```java
private static volatile boolean failing = false;
```

Without `volatile`, the JVM may optimise this field into a CPU register. A thread that sets `failing = true` would update its register only — other threads on different cores would never see the change. `volatile` forces every read and write to go through main memory, guaranteeing visibility across all threads.

### Why Atomic Classes in CircuitBreaker

```java
AtomicReference<CircuitBreakerState> state;
AtomicInteger failureCount;
AtomicLong openedAt;
```

The load balancer handles many concurrent requests. Without atomics, two threads could both see `failureCount == 2` and both try to trip the breaker — resulting in duplicate state changes. Atomic classes use **CPU-level compare-and-swap (CAS) instructions** that are guaranteed to be indivisible. No locks, no `synchronized` blocks, no thread contention.

### Why `compareAndSet` for State Transitions

```java
state.compareAndSet(CircuitBreakerState.CLOSED, CircuitBreakerState.OPEN)
```

This reads the current value, compares it to `CLOSED`, and only sets `OPEN` if the comparison succeeds — **atomically**. If two threads race, exactly one wins and the other finds the state already changed. This is the safest way to implement state machines in concurrent code.

### Why `defer-datasource-initialization`

```properties
spring.jpa.defer-datasource-initialization=true
```

Spring Boot 3 changed the order of initialisation. Without this flag, `data.sql` runs before Hibernate creates the schema — INSERT fails with `Table "PRODUCTS" not found`. This single property fixes the timing by deferring SQL script execution until after the DDL phase completes.

### Why Java's Built-in `HttpClient`

The load balancer uses `java.net.http.HttpClient` (introduced in Java 11) rather than any third-party library. This eliminates a dependency, avoids classpath conflicts with Spring Boot's embedded Tomcat, and the built-in client is fully capable of everything a proxy needs.

---

## Real-World Relevance

The pattern you implemented is used in production systems at scale every day:

| Framework / Library | Used By | Notes |
|---|---|---|
| Netflix Hystrix | Netflix (legacy) | The original OSS circuit breaker; now in maintenance mode |
| Resilience4j | Most Spring Boot shops | Modern replacement for Hystrix; integrates with Micrometer |
| Istio / Envoy | Kubernetes deployments | Sidecar proxy implements circuit breaking at the network level |
| AWS App Mesh | Amazon services | Managed service mesh with built-in circuit breaking |
| Azure Service Fabric | Microsoft Azure | Platform-level resilience for microservices |

The implementation you built mirrors **Resilience4j's `COUNT_BASED` sliding window strategy** — count consecutive failures, trip at threshold, wait for timeout, probe with one request, close on success.

---

## Discussion Questions

1. **Threshold Tuning:** We used `failureThreshold=3` and `timeoutMs=10000`. In a real system processing 10,000 requests per second, would these values be appropriate? How would you adjust them?

2. **Failure Types:** Our circuit breaker counts HTTP 500 errors. Should a circuit breaker also trip if a service returns HTTP 404 (Not Found) or HTTP 400 (Bad Request)? Why or why not?

3. **Fallback Mechanisms:** In an e-commerce platform, if the Recommendation Service circuit breaker trips OPEN, what should the fallback response be? An error? An empty list? A hardcoded generic recommendation?

4. **HALF_OPEN Risks:** Why does the HALF_OPEN state only allow **one** probe request instead of a small percentage of total traffic?

---

## Extension Challenges

### 1 — Sliding Window Instead of Count-Based

The current implementation counts all failures from the last reset. A more sophisticated approach uses a rolling window: "5 failures in the last 10 requests" rather than "5 failures since last reset." Implement a circular buffer of recent outcomes in `CircuitBreaker.java`.

### 2 — Per-Route Circuit Breakers

Right now one circuit breaker covers the entire backend instance. In production, `/api/products` might be healthy while `/api/orders` is broken on the same server. Add a second dimension keyed on `(instance, path)`.

### 3 — Metrics and Monitoring

Add Micrometer to the load balancer and expose circuit breaker state as a Prometheus gauge. Run Prometheus + Grafana locally and build a dashboard that shows breaker state, failure rate, and request latency over time.

### 4 — Weighted Round-Robin

Some backends may be more powerful than others. Add a `weight` field to each `BackendInstance` and modify `LoadBalancer.selectInstance()` to route proportionally — a backend with weight 2 gets twice as many requests as one with weight 1.

### 5 — Distributed State

The current circuit breaker state lives in memory — if the load balancer restarts, all breakers reset to `CLOSED`. Add a Redis dependency and back the `CircuitBreaker` state with a Redis hash so multiple load balancer instances share a consistent view.

---

## Key Takeaways

1. **Failures are inevitable.** Networks partition, servers crash, deployments go wrong. The question is not whether your system will experience failures — it is whether your system will contain them.

2. **The circuit breaker stops cascade.** Without it, a single slow server drags down the entire fleet as connection pools exhaust and timeouts pile up.

3. **Self-healing is the goal.** The HALF_OPEN probe and automatic CLOSED transition mean your system recovers without operator action. In a system with hundreds of services, manual recovery does not scale.

4. **Observability is not optional.** The `/lb/status` endpoint is what on-call engineers look at during an incident. Without real-time visibility into circuit breaker state, you are flying blind.

5. **Concurrency correctness matters.** The circuit breaker code uses `volatile`, `AtomicReference`, `AtomicInteger`, and `compareAndSet` — not because it was more convenient, but because the correctness of the entire system depends on these decisions being right under concurrent load.

---

:::note[📸 Image Placeholder]
Insert the final system architecture diagram here as a clean, polished version — showing the full picture: client → load balancer → three backends, with all circuit breakers in CLOSED state (green). This is a great "hero" image to end on.
:::

> **Congratulations.** You did not just learn a pattern from a textbook — you built it, broke it, and watched it heal itself. That experience is something you will carry into every distributed system you design from here.

---
sidebar_position: 10
title: "Step 9: Configuration"
description: Configure the load balancer — backend URLs, circuit breaker thresholds, health check interval
---

# Step 9: Configuration

## File Location

```
src/main/resources/
└── application.properties   ← edit this
```

## Configuration

Replace the entire contents with:

```properties
# ============================================================
# Circuit Breaker Activity — Load Balancer Configuration
# ============================================================

server.port=8080
spring.application.name=activity-load-balancer

# ── Backend Instances ──────────────────────────────────────────────────
# Comma-separated list of backend server URLs.
# Add or remove entries here if you run more or fewer instances.
lb.instances=http://localhost:8091,http://localhost:8092,http://localhost:8093

# ── Circuit Breaker ────────────────────────────────────────────────────
# failure-threshold: how many consecutive 5xx responses before tripping OPEN
# timeout-ms:        how long (ms) the breaker stays OPEN before allowing a probe
lb.circuit-breaker.failure-threshold=3
lb.circuit-breaker.timeout-ms=10000

# ── Health Checking ────────────────────────────────────────────────────
# How often (ms) to poll /actuator/health on each backend
lb.health-check-interval-ms=5000

# ── Actuator ───────────────────────────────────────────────────────────
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always

# ── Logging ────────────────────────────────────────────────────────────
# Set to DEBUG to see every circuit breaker state transition in the terminal
logging.level.org.example.activitylb=DEBUG
```

## Configuration Reference

| Property | Default | Effect |
|---|---|---|
| `lb.instances` | — | Comma-separated backend URLs. One `BackendInstance` is created per entry. |
| `lb.circuit-breaker.failure-threshold` | `3` | Consecutive failures before OPEN |
| `lb.circuit-breaker.timeout-ms` | `10000` | Milliseconds to wait in OPEN before probing |
| `lb.health-check-interval-ms` | `5000` | Milliseconds between health polls |

## Tuning for Different Experiments

| Experiment | Suggested config change |
|---|---|
| Trip faster (1 failure) | `lb.circuit-breaker.failure-threshold=1` |
| Recover faster | `lb.circuit-breaker.timeout-ms=3000` |
| Slower health detection | `lb.health-check-interval-ms=30000` |
| Add a fourth backend | Add `,http://localhost:8094` to `lb.instances` |

---

:::tip[Part 2 complete!]
Both projects are fully built. The directory structure under each project should match what was described in the Part 2 overview.

→ **[Part 3: Run & Demo](../part-3-demo/)**
:::

---
sidebar_position: 3
title: Triggering Failure
description: Crash one server instance and watch the circuit breaker trip to OPEN
---

# Triggering Failure

**Goal:** Simulate a server failure, send enough requests to cross the failure threshold, and watch the circuit breaker trip from `CLOSED` → `OPEN`.

---

## The Failure Mechanism

When you POST to `/admin/fail`, `AdminController` calls:

```java
ProductServiceImpl.enableFailure();
```

This sets a static volatile flag in `ProductServiceImpl`:

```java
private static volatile boolean failing = false;
```

Every service method checks this flag first:

```java
public List<Product> getAllProducts() {
    if (failing) {
        throw new RuntimeException("Server is in failure mode");
    }
    return productRepository.findAll();
}
```

The `RuntimeException` propagates through the controller and Spring returns **HTTP 500**. The `ProxyController` in the load balancer sees this 500 and calls `cb.recordFailure()` on that instance's circuit breaker.

:::warning
The `volatile` keyword is critical. Without it, the JVM may cache the value of `failing` in a CPU register and other threads will never see the updated value. `volatile` guarantees all threads read from main memory every time.
:::

---

## Step 1 — Confirm Clean State

```bash
curl http://localhost:8080/lb/status
```

All three instances should show `"circuitBreakerState": "CLOSED"` and `"failureCount": 0`.

---

## Step 2 — Put Instance 8091 into Failure Mode

```bash
curl -X POST http://localhost:8091/admin/fail
```

Expected response:
```json
{"status": "FAILURE MODE ON", "message": "All /api/products endpoints now return HTTP 500"}
```

Switch to **Terminal 1** (port 8091). You should see:
```
WARN  o.e.a.service.ProductServiceImpl - >>> FAILURE MODE ENABLED — all requests will return 500
```

:::danger
**The failure mode is active, but the circuit breaker does not know yet.** It only learns about failures when requests actually fail through it. The breaker is still `CLOSED` at this point.
:::

---

## Step 3 — Send Requests Through the Load Balancer

Send 6 requests through port 8080. Round-robin means roughly every third request hits the failing instance:

```bash
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
```

What happens behind the scenes:

| Request # | Backend Hit | Result | Circuit Breaker |
|---|---|---|---|
| 1 | 8091 (failing) | ❌ 500 | `failureCount` → 1 |
| 2 | 8092 | ✅ 200 | — |
| 3 | 8093 | ✅ 200 | — |
| 4 | 8091 (failing) | ❌ 500 | `failureCount` → 2 |
| 5 | 8092 | ✅ 200 | — |
| 6 | 8091 (failing) | ❌ 500 | `failureCount` → 3 → **OPEN** |

After the third failure, the circuit breaker trips. You may need to run more than 6 requests if some landed on 8092/8093 first.

:::note[📸 Image Placeholder]
Insert a screenshot of Terminal 4 (load balancer) logs showing the `[CB]` warning lines as failures are counted, culminating in the `*** → OPEN ***` log line. This is the key moment of the demo.
:::

---

## Step 4 — Observe the Open Breaker

```bash
curl http://localhost:8080/lb/status
```

Expected response for instance 8091:

```json
{
  "url": "http://localhost:8091",
  "healthy": false,
  "available": false,
  "activeRequests": 0,
  "circuitBreakerState": "OPEN",
  "failureCount": 3,
  "failureThreshold": 3,
  "totalRequests": 3,
  "totalFailures": 3,
  "remainingTimeoutMs": 7241
}
```

Key changes from baseline:

| Field | Before | After | Significance |
|---|---|---|---|
| `circuitBreakerState` | `CLOSED` | `OPEN` | Breaker has tripped |
| `healthy` | `true` | `false` | HealthChecker saw actuator return non-UP |
| `available` | `true` | `false` | Both guards say no — instance is excluded |
| `failureCount` | `0` | `3` | Hit the failure threshold |
| `remainingTimeoutMs` | `0` | `~7000` | Time until HALF_OPEN probe attempt |
| `availableInstances` | `3` | `2` | System view of remaining capacity |

:::note[📸 Image Placeholder]
Insert a screenshot of `/lb/status` in the browser showing instance 8091 with `"circuitBreakerState": "OPEN"` and `"available": false`, while 8092 and 8093 remain `CLOSED`. Use a JSON formatter plugin for readability.
:::

---

## Step 5 — Confirm Traffic Avoids the Failing Instance

Send more requests. Every single one should succeed:

```bash
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
```

All return HTTP 200. The load balancer is distributing traffic **only between 8092 and 8093**. Instance 8091 receives nothing — giving it space to recover.

---

## Step 6 — Watch the Timeout Counter

Poll the status a few times over the next 10 seconds:

```bash
curl http://localhost:8080/lb/status
# wait 3 seconds...
curl http://localhost:8080/lb/status
# wait 3 seconds...
curl http://localhost:8080/lb/status
```

You will see `remainingTimeoutMs` for the 8091 instance count down toward `0`. When it reaches `0`, the breaker transitions to `HALF_OPEN` on the next request. That is what the next page covers.

---

## What You Have Proved

- ✅ A single failing instance does not take down the entire system
- ✅ The circuit breaker accurately counts failures up to the threshold
- ✅ After tripping, the load balancer routes around the failed instance automatically
- ✅ Healthy instances continue serving 100% of traffic
- ✅ The `/lb/status` dashboard gives real-time observability into the system state

→ **[Next: Observing the Circuit Breaker](observing-circuit-breaker)**

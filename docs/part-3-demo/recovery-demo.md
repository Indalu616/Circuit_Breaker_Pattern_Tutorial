---
sidebar_position: 5
title: Recovery Demo
description: Watch the circuit breaker self-heal through OPEN → HALF_OPEN → CLOSED
---

# Recovery Demo

**Goal:** Recover the failed instance, observe the circuit breaker move through `OPEN → HALF_OPEN → CLOSED`, and confirm the load balancer resumes sending traffic to the recovered backend — with zero manual intervention on the load balancer.

---

## Starting State

Coming from the Triggering Failure page, you should have:

- Instance 8091: `OPEN`, failure mode still enabled
- Instances 8092 and 8093: `CLOSED`, serving all traffic

Confirm:
```bash
curl http://localhost:8080/lb/status
```

Check that 8091 shows `"circuitBreakerState": "OPEN"` and a positive `remainingTimeoutMs`.

---

## Phase 1 — Recover the Server

Disable the failure mode on instance 8091:

```bash
curl -X POST http://localhost:8091/admin/recover
```

Expected response:
```json
{"status": "FAILURE MODE OFF", "message": "Server has recovered — requests will succeed again"}
```

Switch to **Terminal 1** (port 8091). You should see:
```
INFO  o.e.a.service.ProductServiceImpl - >>> FAILURE MODE DISABLED — server has recovered
```

:::info
The server is now healthy again and will respond with HTTP 200. But the circuit breaker does **not** know this yet — it is still `OPEN` and will not send any traffic to 8091 until the timeout expires (or HealthChecker detects recovery).
:::

---

## Phase 2 — Two Recovery Paths

Depending on timing, the circuit breaker closes via one of two paths:

### Path A — HealthChecker (Fast, within ~5 seconds)

The HealthChecker polls `/actuator/health` every 5 seconds. When it detects 8091 returning `{"status":"UP"}` again, it calls `circuitBreaker.forceClose()` immediately — no waiting for the timeout.

```
[HealthChecker] http://localhost:8091 is back UP → circuit breaker force-closed
[CB] http://localhost:8091 → CLOSED (health check confirmed recovery)
```

Check `/lb/status` — you may already see `CLOSED` again within 5 seconds of recovering.

### Path B — Timeout + HALF_OPEN Probe (Takes up to 10 seconds)

If HealthChecker hasn't fired yet, wait for the timeout. Poll the status:

```bash
curl http://localhost:8080/lb/status
# wait 2 seconds, repeat...
```

Watch `remainingTimeoutMs` count down to `0`. When it hits zero, the **next request routed to 8091** triggers the `OPEN → HALF_OPEN` transition and sends the probe:

```bash
curl http://localhost:8080/api/products
```

The load balancer selects 8091 (round-robin), sees the timeout expired, transitions to `HALF_OPEN`, and sends the probe. The probe succeeds → `HALF_OPEN → CLOSED`.

:::note[📸 Image Placeholder]
Insert a screenshot of Terminal 4 showing the log sequence:
1. `→ HALF_OPEN after Xms (probe request allowed)`
2. `→ CLOSED (probe succeeded — server recovered!)`

Or alternatively: `[HealthChecker] → force-closed`. Both outcomes are valid to capture.
:::

---

## Phase 3 — Confirm Full Recovery

```bash
curl http://localhost:8080/lb/status
```

Expected:

```json
{
  "availableInstances": 3,
  "totalInstances": 3,
  "instances": [
    {
      "url": "http://localhost:8091",
      "healthy": true,
      "available": true,
      "activeRequests": 0,
      "circuitBreakerState": "CLOSED",
      "failureCount": 0,
      "failureThreshold": 3,
      "totalRequests": 5,
      "totalFailures": 3,
      "remainingTimeoutMs": 0
    }
  ]
}
```

Notice `totalFailures: 3` is preserved (historical counter, never resets) while `failureCount: 0` has been reset (rolling threshold counter, resets on recovery).

:::note[📸 Image Placeholder]
Insert a screenshot of `/lb/status` with all three instances back to `CLOSED`. This is the "happy ending" screenshot — the system has fully self-healed.
:::

---

## Phase 4 — Confirm Traffic Resumes

Send several requests to confirm round-robin is cycling through all three instances again:

```bash
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
```

All six should return HTTP 200. Check `/lb/status` one final time and observe `totalRequests` increasing on all three instances.

---

## The Complete Timeline

```
t=0s    POST /admin/fail on 8091
            8091 returns HTTP 500 on every /api/products call
            Circuit breaker: CLOSED (still unaware)

t=2s    6x curl through :8080
            Requests 1, 4, 6 hit 8091 → 500
            failureCount: 1, 2, 3 → threshold hit → OPEN
            Requests 2, 3, 5 hit 8092/8093 → 200

t=5s    POST /admin/recover on 8091
            8091 returns HTTP 200 again
            Circuit breaker: still OPEN (remainingTimeoutMs ~5000)

t=10s   (Timeout path) timeout expires → HALF_OPEN
        OR
        (HealthChecker path) HealthChecker polls → detects UP → forceClose()

t=10s   CLOSED — failureCount reset to 0
            All traffic resumes across 3 instances
            Zero operator action on the load balancer
```

---

## What If the Probe Fails?

If you had not called `/admin/recover` before the probe, the probe would find 8091 still failing. The circuit breaker would call `recordFailure()` in `HALF_OPEN` state:

```java
if (current == CircuitBreakerState.HALF_OPEN) {
    state.set(CircuitBreakerState.OPEN);
    openedAt.set(System.currentTimeMillis());
    log.warn("[CB] {} → OPEN (probe failed — restarting {}ms timeout)", serverUrl, timeoutMs);
}
```

The breaker goes back to `OPEN`, the timeout resets, and the system waits another 10 seconds before trying again. The cycle repeats until the server genuinely recovers. **The system never gives up, but it also never floods a struggling server.**

---

## What You Have Proved

- ✅ The circuit breaker transitions `OPEN → HALF_OPEN` after the configured timeout
- ✅ Exactly one probe request is sent to test the recovered server
- ✅ A successful probe closes the breaker and restores full traffic
- ✅ A failed probe would re-open the breaker and reset the timeout
- ✅ The entire recovery cycle requires **zero human intervention** on the load balancer
- ✅ Historical counters (`totalFailures`) are preserved for observability

---

:::tip[Congratulations!]
You have completed all three tests. The system detected failure, isolated it, and self-healed — exactly as a production circuit breaker should. Continue to the **[Conclusion →](../conclusion)**
:::

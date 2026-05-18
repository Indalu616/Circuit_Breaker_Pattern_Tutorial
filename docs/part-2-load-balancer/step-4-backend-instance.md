---
sidebar_position: 5
title: "Step 4: BackendInstance"
description: Value object bundling URL, health flag, and circuit breaker per server
---

# Step 4: BackendInstance

## Why This Class Exists

`BackendInstance` is a **value object** that bundles together everything the load balancer needs to know about one backend server:

- Its URL
- Whether the last health check said it was alive (`healthy`)
- Its circuit breaker
- How many requests are currently in-flight (`activeRequests`)

The key method is `isAvailable()` — the single boolean that `LoadBalancer.selectInstance()` consults before routing a request. It combines both the health flag and the circuit breaker into one clean gate.

## Where to Create It

```
src/main/java/org/example/activitylb/
└── BackendInstance.java   ← create this
```

## Code

```java
package org.example.activitylb;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Represents one backend server: URL + health status + circuit breaker + in-flight count.
 *
 * Each BackendInstance is completely independent — one failing server does not
 * affect the others in any way.
 *
 * isAvailable() is the single gate the LoadBalancer checks before routing:
 *   true  → this server will receive the next request
 *   false → LoadBalancer tries the next server in the round-robin order
 */
public class BackendInstance {

    private final String         url;
    private final CircuitBreaker circuitBreaker;
    private final AtomicBoolean  healthy        = new AtomicBoolean(true);
    private final AtomicInteger  activeRequests = new AtomicInteger(0);

    public BackendInstance(String url, int failureThreshold, long timeoutMs) {
        this.url            = url;
        this.circuitBreaker = new CircuitBreaker(url, failureThreshold, timeoutMs);
    }

    /**
     * The routing gate.
     *
     * Returns true only when BOTH conditions are met:
     *   1. The last health check returned UP (healthy == true)
     *   2. The circuit breaker is CLOSED or HALF_OPEN (canAttemptRequest() == true)
     *
     * If EITHER is false, this server is skipped in round-robin selection.
     */
    public boolean isAvailable() {
        return healthy.get() && circuitBreaker.canAttemptRequest();
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public String  getUrl()              { return url; }
    public boolean isHealthy()           { return healthy.get(); }
    public void    setHealthy(boolean h) { healthy.set(h); }
    public int     getActiveRequests()   { return activeRequests.get(); }
    public CircuitBreaker getCircuitBreaker() { return circuitBreaker; }

    /** Called just before forwarding a request to this server. */
    public void incrementActive() { activeRequests.incrementAndGet(); }

    /** Called in a finally block after the response (or exception) returns. */
    public void decrementActive() { activeRequests.decrementAndGet(); }
}
```

## The Two-Gate Design

```
isAvailable() = healthy.get()  AND  circuitBreaker.canAttemptRequest()
                      │                          │
                      │                          └── CLOSED or HALF_OPEN?
                      │                               (checked every request)
                      │
                      └── Updated by HealthChecker every 5 seconds
                           (polls /actuator/health)
```

| Scenario | `healthy` | `canAttemptRequest()` | `isAvailable()` |
|---|---|---|---|
| Server running, all good | `true` | `true` | ✅ `true` |
| Server returning 500s, CB tripped | `false` | `false` | ❌ `false` |
| Server dead (process killed) | `false` | `false` | ❌ `false` |
| Server recovered, CB still OPEN | `true` | `false` | ❌ `false` |
| CB timeout expired (HALF_OPEN) | `true` | `true` | ✅ `true` (probe) |

The `healthy` flag handles the case where the **server process is completely dead**. The circuit breaker handles the case where the **server is alive but returning errors**. Both gates must be open for traffic to flow.

---

:::tip
→ Continue to **[Step 5: Create LoadBalancer](step-5-load-balancer)**
:::

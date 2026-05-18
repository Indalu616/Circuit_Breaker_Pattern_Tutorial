---
sidebar_position: 4
title: "Step 3: CircuitBreaker"
description: The thread-safe state machine engine — the most important class
---

# Step 3: CircuitBreaker

## Why This Is the Most Important Class

`CircuitBreaker` is the **engine** of the entire activity. Every other class either feeds data into it or reads state out of it. It implements the state machine described in the Background section using Java's atomic classes for thread safety.

### Why Atomic Variables?

The load balancer handles **many concurrent HTTP requests**. Multiple threads could call `recordFailure()` simultaneously. Using a regular `int` for the failure counter would cause a **race condition** — two threads could read the same value, both increment, and write back the same result, effectively losing a count.

`AtomicInteger` and `AtomicLong` solve this with **lock-free compare-and-swap (CAS) operations** — hardware-level atomic instructions that guarantee correctness without the performance cost of `synchronized` blocks.

## Where to Create It

```
src/main/java/org/example/activitylb/
└── CircuitBreaker.java   ← create this
```

## Code

```java
package org.example.activitylb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Per-instance circuit breaker implementing the CLOSED / OPEN / HALF_OPEN state machine.
 *
 * One instance of this class exists per backend server — completely independent.
 * A trip on server 8091 has no effect on the breakers for 8092 or 8093.
 *
 * Thread safety: all mutable state uses java.util.concurrent.atomic classes.
 * No synchronized blocks or locks needed — operations are lock-free.
 *
 * Usage:
 *   1. Before sending: if (!canAttemptRequest()) skip this server
 *   2. After success:  recordSuccess()
 *   3. After failure:  recordFailure()
 */
public class CircuitBreaker {

    private static final Logger log = LoggerFactory.getLogger(CircuitBreaker.class);

    private final String serverUrl;
    private final int    failureThreshold;  // how many failures before tripping
    private final long   timeoutMs;         // how long to stay OPEN before probing

    // ── Core state (all thread-safe) ─────────────────────────────────────────

    private final AtomicReference<CircuitBreakerState> state =
            new AtomicReference<>(CircuitBreakerState.CLOSED);

    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicLong    openedAt     = new AtomicLong(0);

    // ── Counters for /lb/status dashboard ────────────────────────────────────

    private final AtomicInteger totalRequests = new AtomicInteger(0);
    private final AtomicInteger totalFailures = new AtomicInteger(0);

    public CircuitBreaker(String serverUrl, int failureThreshold, long timeoutMs) {
        this.serverUrl        = serverUrl;
        this.failureThreshold = failureThreshold;
        this.timeoutMs        = timeoutMs;
    }

    // ── Core API ──────────────────────────────────────────────────────────────

    /**
     * Returns true if a request should be forwarded to this server.
     *
     * CLOSED   → always true
     * OPEN     → true only if the timeout has expired (then transitions to HALF_OPEN)
     * HALF_OPEN → true (the probe is allowed through)
     */
    public boolean canAttemptRequest() {
        CircuitBreakerState current = state.get();

        if (current == CircuitBreakerState.CLOSED) {
            return true;
        }

        if (current == CircuitBreakerState.OPEN) {
            long elapsed = System.currentTimeMillis() - openedAt.get();
            if (elapsed >= timeoutMs) {
                // Timeout expired — transition to HALF_OPEN and allow one probe
                if (state.compareAndSet(CircuitBreakerState.OPEN, CircuitBreakerState.HALF_OPEN)) {
                    log.info("[CB] {} → HALF_OPEN after {}ms (probe request allowed)",
                            serverUrl, elapsed);
                }
                return true;
            }
            return false;   // still within timeout — reject immediately
        }

        // HALF_OPEN → allow the probe through
        return true;
    }

    /**
     * Call this after a successful response (any non-5xx status code).
     *
     * HALF_OPEN: probe succeeded → transition to CLOSED (server recovered!)
     * CLOSED:    reset failure counter (a success clears the slate)
     */
    public void recordSuccess() {
        totalRequests.incrementAndGet();
        CircuitBreakerState current = state.get();

        if (current == CircuitBreakerState.HALF_OPEN) {
            state.set(CircuitBreakerState.CLOSED);
            failureCount.set(0);
            log.info("[CB] {} → CLOSED (probe succeeded — server recovered!)", serverUrl);

        } else if (current == CircuitBreakerState.CLOSED) {
            failureCount.set(0);
        }
    }

    /**
     * Call this after a failed response (5xx status or network exception).
     *
     * HALF_OPEN: probe failed → back to OPEN, timeout restarts
     * CLOSED:    increment counter; if >= threshold → trip to OPEN
     */
    public void recordFailure() {
        totalRequests.incrementAndGet();
        totalFailures.incrementAndGet();
        CircuitBreakerState current = state.get();

        if (current == CircuitBreakerState.HALF_OPEN) {
            state.set(CircuitBreakerState.OPEN);
            openedAt.set(System.currentTimeMillis());
            log.warn("[CB] {} → OPEN (probe failed — server still down, restarting {}ms timeout)",
                    serverUrl, timeoutMs);
            return;
        }

        int failures = failureCount.incrementAndGet();
        log.warn("[CB] {} failure {}/{}", serverUrl, failures, failureThreshold);

        if (failures >= failureThreshold
                && state.compareAndSet(CircuitBreakerState.CLOSED, CircuitBreakerState.OPEN)) {
            openedAt.set(System.currentTimeMillis());
            log.error("[CB] *** {} → OPEN *** ({} consecutive failures hit threshold!)",
                    serverUrl, failureThreshold);
        }
    }

    /**
     * Called by HealthChecker when /actuator/health returns UP after being DOWN.
     * Force-closes the breaker immediately — no need to wait for the timeout.
     */
    public void forceClose() {
        if (state.getAndSet(CircuitBreakerState.CLOSED) != CircuitBreakerState.CLOSED) {
            failureCount.set(0);
            log.info("[CB] {} → CLOSED (health check confirmed recovery)", serverUrl);
        }
    }

    // ── Getters for StatusController ──────────────────────────────────────────

    public CircuitBreakerState getState()    { return state.get(); }
    public int  getFailureCount()            { return failureCount.get(); }
    public int  getFailureThreshold()        { return failureThreshold; }
    public int  getTotalRequests()           { return totalRequests.get(); }
    public int  getTotalFailures()           { return totalFailures.get(); }
    public long getTimeoutMs()               { return timeoutMs; }

    /** Milliseconds remaining before OPEN transitions to HALF_OPEN. Zero if not OPEN. */
    public long getRemainingTimeoutMs() {
        if (state.get() != CircuitBreakerState.OPEN) return 0;
        return Math.max(0, timeoutMs - (System.currentTimeMillis() - openedAt.get()));
    }
}
```

## Tracing Through a Failure Sequence

With `failureThreshold=3` and `timeoutMs=10000`:

```
Request 1 → backend 500 → recordFailure() → failureCount=1   state=CLOSED
Request 2 → backend 500 → recordFailure() → failureCount=2   state=CLOSED
Request 3 → backend 500 → recordFailure() → failureCount=3   state=OPEN  ← tripped!
Request 4 → canAttemptRequest()=false → skip (no backend contact)
...10 seconds pass...
Request N → canAttemptRequest() detects timeout → state=HALF_OPEN
Request N → backend 200 → recordSuccess() → state=CLOSED      ← recovered!
```

## Why `compareAndSet` for State Transitions

```java
state.compareAndSet(CircuitBreakerState.CLOSED, CircuitBreakerState.OPEN)
```

This is an **atomic test-and-set**. It only updates `state` to `OPEN` if it currently equals `CLOSED`. If two threads race to open the circuit:

- Thread A: reads `CLOSED`, CAS succeeds → state is now `OPEN` ✓
- Thread B: reads `OPEN` (A already changed it), CAS fails → nothing happens ✓

Without `compareAndSet`, both threads would trip the breaker, potentially corrupting `openedAt` and `failureCount`.

---

:::tip
→ Continue to **[Step 4: Create BackendInstance](step-4-backend-instance)**
:::

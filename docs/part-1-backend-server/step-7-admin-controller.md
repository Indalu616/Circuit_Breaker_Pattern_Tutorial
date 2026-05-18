---
sidebar_position: 8
title: "Step 7: Admin Controller"
description: Endpoints to trigger and recover from simulated failure
---

# Step 7: Admin Controller

## Why This Class Exists

`AdminController` gives you **surgical control** over the failure state of any individual server instance. It exposes three endpoints:

- `POST /admin/fail` — puts the server into failure mode (all product endpoints return 500)
- `POST /admin/recover` — takes the server out of failure mode
- `GET /admin/status` — tells you the current failure state

In a real system you would never expose this. In this activity, it is what lets you **demonstrate the circuit breaker tripping and recovering on demand**, without needing to kill a process.

## Where to Create It

Inside the same `controller` package:

```
controller/
├── ProductController.java
└── AdminController.java   ← create this
```

## Code

```java
package org.example.activityserver.controller;

import org.example.activityserver.service.ProductServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Demo-only controller used exclusively for the Circuit Breaker activity.
 *
 * These endpoints let you toggle "server failure" on or off at runtime
 * so you can watch the load balancer's circuit breaker respond in real time.
 *
 * POST /admin/fail     → server begins returning 500 on all /api/products calls
 * POST /admin/recover  → server returns to normal operation
 * GET  /admin/status   → returns {"failureMode": true/false}
 *
 * In production code, endpoints like these would be secured or removed entirely.
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    /**
     * Enable failure mode — all product endpoints will now throw exceptions.
     * The load balancer will start receiving HTTP 500 responses.
     * After 'failure-threshold' consecutive failures, its circuit breaker trips OPEN.
     */
    @PostMapping("/fail")
    public ResponseEntity<Map<String, String>> enableFailure() {
        ProductServiceImpl.enableFailure();
        return ResponseEntity.ok(Map.of(
                "status",  "FAILURE MODE ON",
                "message", "All /api/products endpoints now return HTTP 500"
        ));
    }

    /**
     * Disable failure mode — the server is healthy again.
     * The load balancer's health checker will detect recovery within 5 seconds.
     * The circuit breaker will move from OPEN → HALF_OPEN → CLOSED on the next probe.
     */
    @PostMapping("/recover")
    public ResponseEntity<Map<String, String>> disableFailure() {
        ProductServiceImpl.disableFailure();
        return ResponseEntity.ok(Map.of(
                "status",  "FAILURE MODE OFF",
                "message", "Server has recovered — requests will succeed again"
        ));
    }

    /**
     * Shows whether this server is currently in failure mode.
     * Useful for quickly checking the state of any individual instance.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        boolean f = ProductServiceImpl.isFailing();
        return ResponseEntity.ok(Map.of(
                "failureMode", f,
                "message",     f ? "Server is simulating failure" : "Server is healthy"
        ));
    }
}
```

## Demo Script Preview

Here is how you will use this controller in Part 3:

```bash
# 1. Crash instance on port 8091
curl -X POST http://localhost:8091/admin/fail

# 2. Send requests through the load balancer to trip the circuit breaker
curl http://localhost:8080/api/products   # ← repeat 6 times

# 3. Check /lb/status — 8091 should now show OPEN
curl http://localhost:8080/lb/status

# 4. Recover instance 8091
curl -X POST http://localhost:8091/admin/recover

# 5. After 10 seconds, check /lb/status again — should show CLOSED
curl http://localhost:8080/lb/status
```

---

:::tip
→ Continue to **[Step 8: Configure application.properties](step-8-configuration)**
:::

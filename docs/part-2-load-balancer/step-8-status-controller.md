---
sidebar_position: 9
title: "Step 8: StatusController"
description: Real-time dashboard for monitoring all circuit breaker states
---

# Step 8: StatusController

## Why This Class Exists

`StatusController` is your **live dashboard**. While running Part 3, keep `GET http://localhost:8080/lb/status` open in a browser tab or repeatedly call it with curl. It shows the real-time state of every circuit breaker so you can watch the state transitions as you trigger failures and recoveries.

## Where to Create It

```
src/main/java/org/example/activitylb/
└── StatusController.java   ← create this
```

## Code

```java
package org.example.activitylb;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Exposes a real-time dashboard of circuit breaker state for all backend instances.
 *
 * GET /lb/status
 *
 * Keep this open in a browser tab while running Part 3 to watch the circuit breakers
 * transition between CLOSED → OPEN → HALF_OPEN → CLOSED in real time.
 */
@RestController
@RequestMapping("/lb")
public class StatusController {

    private final LoadBalancer loadBalancer;

    public StatusController(LoadBalancer loadBalancer) {
        this.loadBalancer = loadBalancer;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        List<BackendInstance> all = loadBalancer.getAllInstances();
        long available = all.stream().filter(BackendInstance::isAvailable).count();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("availableInstances", available);
        response.put("totalInstances",     all.size());
        response.put("instances",          all.stream().map(this::describe).toList());

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> describe(BackendInstance inst) {
        CircuitBreaker cb = inst.getCircuitBreaker();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("url",                 inst.getUrl());
        m.put("healthy",             inst.isHealthy());
        m.put("available",           inst.isAvailable());
        m.put("activeRequests",      inst.getActiveRequests());
        m.put("circuitBreakerState", cb.getState().name());
        m.put("failureCount",        cb.getFailureCount());
        m.put("failureThreshold",    cb.getFailureThreshold());
        m.put("totalRequests",       cb.getTotalRequests());
        m.put("totalFailures",       cb.getTotalFailures());
        m.put("remainingTimeoutMs",  cb.getRemainingTimeoutMs());
        return m;
    }
}
```

## Sample Responses

**All servers healthy (normal operation):**

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
      "totalRequests": 12,
      "totalFailures": 0,
      "remainingTimeoutMs": 0
    }
  ]
}
```

**After tripping 8091's breaker:**

```json
{
  "url": "http://localhost:8091",
  "healthy": false,
  "available": false,
  "circuitBreakerState": "OPEN",
  "failureCount": 3,
  "failureThreshold": 3,
  "remainingTimeoutMs": 7843
}
```

:::note[📸 Image Placeholder]
Insert a screenshot of the `/lb/status` response in a browser (formatted JSON), showing one instance in OPEN state and two instances in CLOSED state. This is the most illustrative screenshot of the entire activity.
:::

---

:::tip
→ Continue to **[Step 9: Configure application.properties](step-9-configuration)**
:::

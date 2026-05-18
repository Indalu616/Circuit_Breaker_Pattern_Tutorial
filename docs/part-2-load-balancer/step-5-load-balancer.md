---
sidebar_position: 6
title: "Step 5: LoadBalancer"
description: Round-robin selection with circuit-breaker awareness
---

# Step 5: LoadBalancer

## Why This Class Exists

`LoadBalancer` implements the **round-robin selection algorithm** with circuit-breaker awareness. Its job is to pick the next available backend server whenever `ProxyController` needs to forward a request.

Round-robin works by incrementing a counter on every call and using `counter % numberOfServers` to select the index. The twist here is that if the selected server is unavailable, the algorithm tries the next one — up to `N` times (where `N` is the number of servers). If no server is available, it returns `null` and the caller responds with 503.

## Where to Create It

```
src/main/java/org/example/activitylb/
└── LoadBalancer.java   ← create this
```

## Code

```java
package org.example.activitylb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Round-robin load balancer with circuit-breaker awareness.
 *
 * Reads backend instance URLs from application.properties at startup
 * and creates one BackendInstance (with its own CircuitBreaker) per URL.
 *
 * selectInstance() advances the round-robin counter and skips any instance
 * whose isAvailable() returns false.
 * Returns null if no instance is available — callers should respond with 503.
 */
@Component
public class LoadBalancer {

    private static final Logger log = LoggerFactory.getLogger(LoadBalancer.class);

    private final List<BackendInstance> instances;
    private final AtomicInteger         counter = new AtomicInteger(0);

    public LoadBalancer(
            @Value("${lb.instances}") String instancesConfig,
            @Value("${lb.circuit-breaker.failure-threshold:3}") int failureThreshold,
            @Value("${lb.circuit-breaker.timeout-ms:10000}") long timeoutMs) {

        this.instances = Arrays.stream(instancesConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(url -> new BackendInstance(url, failureThreshold, timeoutMs))
                .toList();

        log.info("[LoadBalancer] Registered {} backend instance(s):", instances.size());
        instances.forEach(i -> log.info("  → {}", i.getUrl()));
    }

    /**
     * Selects the next available backend using round-robin with skip-on-unavailable.
     *
     * Algorithm:
     *   for attempt in [0, numberOfServers):
     *     index = abs(counter++ % numberOfServers)
     *     if instances[index].isAvailable() → return it
     *   return null  (all circuit breakers OPEN)
     *
     * @return a BackendInstance ready to receive a request, or null if none available
     */
    public BackendInstance selectInstance() {
        int size = instances.size();
        if (size == 0) return null;

        for (int attempt = 0; attempt < size; attempt++) {
            // Math.abs guards against Integer overflow making the index negative
            int index = Math.abs(counter.getAndIncrement() % size);
            BackendInstance inst = instances.get(index);

            if (inst.isAvailable()) {
                log.debug("[LoadBalancer] Routing to {} (circuit: {}, active: {})",
                        inst.getUrl(),
                        inst.getCircuitBreaker().getState(),
                        inst.getActiveRequests());
                return inst;
            }

            log.debug("[LoadBalancer] Skipping {} (circuit: {}, healthy: {})",
                    inst.getUrl(),
                    inst.getCircuitBreaker().getState(),
                    inst.isHealthy());
        }

        log.error("[LoadBalancer] No available instances — all circuit breakers OPEN!");
        return null;
    }

    public List<BackendInstance> getAllInstances() {
        return instances;
    }
}
```

## Round-Robin Visualised

With 3 servers (8091, 8092, 8093) and 8091's breaker OPEN:

```
Request 1: counter=0 → index=0 (8091) → OPEN → skip
           counter=1 → index=1 (8092) → available → route here ✓
Request 2: counter=2 → index=2 (8093) → available → route here ✓
Request 3: counter=3 → index=0 (8091) → OPEN → skip
           counter=4 → index=1 (8092) → available → route here ✓
```

Traffic distributes evenly across the healthy servers while the broken one receives nothing.

:::note[📸 Image Placeholder]
Insert a diagram showing round-robin distribution across three servers, with one server (8091) crossed out / greyed out due to an OPEN circuit breaker, while requests flow only to 8092 and 8093.
:::

---

:::tip
→ Continue to **[Step 6: Create HealthChecker](step-6-health-checker)**
:::

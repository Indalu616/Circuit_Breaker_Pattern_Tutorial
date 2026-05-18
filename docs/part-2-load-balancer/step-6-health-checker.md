---
sidebar_position: 7
title: "Step 6: HealthChecker"
description: Background polling of /actuator/health for fast recovery detection
---

# Step 6: HealthChecker

## Why This Class Exists

The circuit breaker responds to **application-level failures** (5xx responses). But what if the server process is **completely dead** — killed with Ctrl+C, OOM-killed by the OS?

In that case, the load balancer gets a `Connection refused` or `SocketTimeoutException` — which also triggers `recordFailure()` and eventually trips the circuit breaker. But recovery through the HALF_OPEN probe would be slow if the server takes a long time to restart.

`HealthChecker` solves this with **proactive background polling**: every 5 seconds, it sends `GET /actuator/health` to each backend. If a server that was previously DOWN comes back UP, the circuit breaker is **force-closed immediately** — no need to wait for the timeout.

## How `@Scheduled` Works

`@Scheduled(fixedDelayString = "...")` tells Spring to run the method repeatedly with a fixed delay between the end of one execution and the start of the next. The delay is read from `application.properties` — making it configurable without recompiling.

`@EnableScheduling` on the main application class (added in Step 1) activates the Spring scheduling infrastructure. Without it, `@Scheduled` methods are silently ignored.

## Where to Create It

```
src/main/java/org/example/activitylb/
└── HealthChecker.java   ← create this
```

## Code

```java
package org.example.activitylb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Background health checker that polls /actuator/health on every backend server.
 *
 * Runs every 'lb.health-check-interval-ms' milliseconds (default: 5000).
 * Updates BackendInstance.healthy based on the result.
 *
 * When a server transitions from DOWN → UP, the circuit breaker is force-closed
 * so traffic resumes immediately without waiting for the HALF_OPEN timeout.
 *
 * Requires @EnableScheduling on ActivityLoadBalancerApplication.
 */
@Component
public class HealthChecker {

    private static final Logger log = LoggerFactory.getLogger(HealthChecker.class);

    private final LoadBalancer loadBalancer;
    private final HttpClient   http;

    public HealthChecker(LoadBalancer loadBalancer,
                         @Value("${lb.health-check-interval-ms:5000}") long intervalMs) {
        this.loadBalancer = loadBalancer;
        // Short connect timeout — if the server doesn't respond in 2 seconds, it's down
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    /**
     * Polls all registered backend instances.
     * fixedDelay: wait this many ms after the last execution completes before starting next.
     */
    @Scheduled(fixedDelayString = "${lb.health-check-interval-ms:5000}")
    public void checkAll() {
        for (BackendInstance instance : loadBalancer.getAllInstances()) {
            checkInstance(instance);
        }
    }

    private void checkInstance(BackendInstance instance) {
        String healthUrl = instance.getUrl() + "/actuator/health";
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(healthUrl))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

            // Actuator returns {"status":"UP"} when healthy
            boolean up = resp.statusCode() == 200
                      && resp.body().contains("\"status\":\"UP\"");

            boolean wasHealthy = instance.isHealthy();
            instance.setHealthy(up);

            if (up && !wasHealthy) {
                // Server just came back — force-close the circuit breaker
                instance.getCircuitBreaker().forceClose();
                log.info("[HealthChecker] {} is back UP → circuit breaker force-closed",
                        instance.getUrl());
            } else if (!up && wasHealthy) {
                log.warn("[HealthChecker] {} is DOWN (HTTP {})",
                        instance.getUrl(), resp.statusCode());
            }

        } catch (Exception e) {
            // Connection refused, timeout, etc. — server is unreachable
            if (instance.isHealthy()) {
                log.warn("[HealthChecker] {} is UNREACHABLE: {}",
                        instance.getUrl(), e.getMessage());
            }
            instance.setHealthy(false);
        }
    }
}
```

## Circuit Breaker vs. Health Checker

| Scenario | Who Detects It | How |
|---|---|---|
| Server returns HTTP 500 | Circuit Breaker | `recordFailure()` called by ProxyController |
| Server process is dead (connection refused) | Circuit Breaker + HealthChecker | CB trips on connection exception; HC marks unhealthy |
| Server recovers (returns 200 again) | **HealthChecker (fast)** or CB HALF_OPEN (slow) | HC force-closes immediately; CB would wait for timeout |

:::tip
HealthChecker is the **fast recovery path**. It detects server-level recovery within 5 seconds and closes the circuit immediately, instead of waiting for the full 10-second timeout + HALF_OPEN probe cycle.
:::

---

:::tip
→ Continue to **[Step 7: Create ProxyController](step-7-proxy-controller)**
:::

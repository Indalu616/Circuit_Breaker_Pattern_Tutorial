---
sidebar_position: 8
title: "Step 7: ProxyController"
description: Forward all incoming HTTP requests to a backend server
---

# Step 7: ProxyController

## Why This Class Exists

`ProxyController` is the **entry point for all incoming HTTP traffic**. The `@RequestMapping("/**")` annotation makes it catch every request regardless of path — `/api/products`, `/admin/fail`, etc. — and forward it to a backend server.

It orchestrates the complete request lifecycle:
1. Ask the `LoadBalancer` for an available server
2. Forward the request byte-for-byte using `java.net.http.HttpClient`
3. Record success or failure on the circuit breaker
4. Stream the response back to the caller

:::danger
**Do not use Apache HttpClient here.** The version bundled with Spring Boot's embedded Tomcat conflicts with standalone Apache HttpClient 5, causing `java.net.SocketException: Connection reset`. Use `java.net.http.HttpClient` (Java 11+ built-in) as shown below.
:::

## Where to Create It

```
src/main/java/org/example/activitylb/
└── ProxyController.java   ← create this
```

## Code

```java
package org.example.activitylb;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.Set;

/**
 * Catches ALL incoming HTTP requests (/**) and forwards them to a backend server.
 *
 * Uses java.net.http.HttpClient (Java 11+ standard library).
 * No Apache HttpClient dependency — avoids the "Connection reset" runtime error.
 *
 * Request flow:
 *   1. selectInstance()         → get next available backend (null → 503)
 *   2. Forward request          → copy method, headers, body byte-for-byte
 *   3. recordSuccess/Failure()  → update circuit breaker state
 *   4. Return response          → copy status code, headers, body back to caller
 */
@RestController
public class ProxyController {

    private static final Logger log = LoggerFactory.getLogger(ProxyController.class);

    // Hop-by-hop headers must NOT be forwarded to the backend
    private static final Set<String> HOP_BY_HOP = Set.of(
            "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
            "te", "trailers", "transfer-encoding", "upgrade", "host"
    );

    private final LoadBalancer loadBalancer;
    private final HttpClient   httpClient;

    public ProxyController(LoadBalancer loadBalancer) {
        this.loadBalancer = loadBalancer;
        this.httpClient   = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @RequestMapping("/**")
    public ResponseEntity<byte[]> proxy(HttpServletRequest request) {
        BackendInstance instance = loadBalancer.selectInstance();

        if (instance == null) {
            log.error("[Proxy] 503 — all circuit breakers OPEN, no backends available");
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("All backend servers are currently unavailable.".getBytes());
        }

        String targetUrl = buildTargetUrl(instance.getUrl(), request);
        log.info("[Proxy] {} {} → {}", request.getMethod(), request.getRequestURI(), targetUrl);

        instance.incrementActive();
        try {
            return forward(request, targetUrl, instance);
        } finally {
            instance.decrementActive();
        }
    }

    // ── Internal forwarding ───────────────────────────────────────────────────

    private ResponseEntity<byte[]> forward(
            HttpServletRequest request, String targetUrl, BackendInstance instance) {

        CircuitBreaker cb = instance.getCircuitBreaker();
        try {
            byte[] reqBody = request.getInputStream().readAllBytes();

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(10));

            // Copy request headers, skipping hop-by-hop headers
            Collections.list(request.getHeaderNames()).stream()
                    .filter(name -> !HOP_BY_HOP.contains(name.toLowerCase()))
                    .forEach(name -> {
                        try { builder.header(name, request.getHeader(name)); }
                        catch (IllegalArgumentException ignored) { /* skip invalid headers */ }
                    });

            // Set HTTP method and body
            switch (request.getMethod().toUpperCase()) {
                case "GET"    -> builder.GET();
                case "DELETE" -> builder.DELETE();
                case "POST"   -> builder.POST(reqBody.length > 0
                        ? HttpRequest.BodyPublishers.ofByteArray(reqBody)
                        : HttpRequest.BodyPublishers.ofString(""));
                case "PUT"    -> builder.PUT(reqBody.length > 0
                        ? HttpRequest.BodyPublishers.ofByteArray(reqBody)
                        : HttpRequest.BodyPublishers.ofString(""));
                default       -> builder.method(request.getMethod(),
                        HttpRequest.BodyPublishers.ofByteArray(reqBody));
            }

            HttpResponse<byte[]> response = httpClient.send(
                    builder.build(), HttpResponse.BodyHandlers.ofByteArray());

            // ── Circuit breaker recording ──────────────────────────────────────
            if (response.statusCode() >= 500) {
                cb.recordFailure();
                log.warn("[Proxy] {} returned {} — failure recorded (count: {}/{})",
                        instance.getUrl(), response.statusCode(),
                        cb.getFailureCount(), cb.getFailureThreshold());
            } else {
                cb.recordSuccess();
            }

            // Copy response headers back
            org.springframework.http.HttpHeaders respHeaders =
                    new org.springframework.http.HttpHeaders();
            response.headers().map().forEach((name, values) -> {
                if (!HOP_BY_HOP.contains(name.toLowerCase())) {
                    values.forEach(v -> respHeaders.add(name, v));
                }
            });

            return new ResponseEntity<>(response.body(), respHeaders,
                    HttpStatus.valueOf(response.statusCode()));

        } catch (Exception e) {
            cb.recordFailure();
            log.error("[Proxy] Request to {} failed: {}", instance.getUrl(), e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(("Backend error: " + e.getMessage()).getBytes());
        }
    }

    private String buildTargetUrl(String base, HttpServletRequest request) {
        String path  = request.getRequestURI();
        String query = request.getQueryString();
        return base + path + (query != null ? "?" + query : "");
    }
}
```

## Why `/**` Doesn't Intercept `/lb/status`

`StatusController` maps to `/lb/status` and `ProxyController` maps to `/**`. Spring MVC resolves **most specific path wins** — `/lb/status` is more specific than `/**`, so status requests are handled by `StatusController` and never reach the proxy.

---

:::tip
→ Continue to **[Step 8: Create StatusController](step-8-status-controller)**
:::

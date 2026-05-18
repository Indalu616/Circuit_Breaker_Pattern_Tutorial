---
sidebar_position: 6
title: "Step 5: Service Implementation"
description: Business logic with a built-in failure simulation toggle
---

# Step 5: Service Implementation

## Why This Class Is the Heart of the Demo

`ProductServiceImpl` does two things:

1. **Delegates database work** to `ProductRepository` — the normal Spring service pattern.
2. **Implements a failure toggle** — a `static volatile boolean failing` flag that, when `true`, makes every method throw a `RuntimeException`. This simulates a real server crash cleanly, without killing the JVM.

When you call `POST /admin/fail` in Part 3, the load balancer will start receiving HTTP 500 responses from this server. After 3 consecutive 500s, the circuit breaker trips to OPEN. **This is the core demo moment.**

## Where to Create It

Inside the `service` package alongside `ProductService.java`:

```
service/
├── ProductService.java
└── ProductServiceImpl.java   ← create this
```

## Code

```java
package org.example.activityserver.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.activityserver.model.Product;
import org.example.activityserver.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Concrete implementation of ProductService.
 *
 * The key feature for the circuit-breaker demo is the static 'failing' flag.
 * When true, every public method throws RuntimeException, causing Spring's
 * default exception handler to return HTTP 500 to the load balancer.
 * The load balancer's circuit breaker counts these 500s and trips to OPEN
 * after reaching the failure threshold (default: 3).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    /**
     * volatile ensures all threads see the latest value immediately.
     * static so the flag is shared across all requests (not per-instance).
     * When true: all service methods throw RuntimeException → HTTP 500.
     */
    private static volatile boolean failing = false;

    // ── Normal service methods ──────────────────────────────────────────────

    @Override
    public List<Product> getAllProducts() {
        simulateFailureIfEnabled();
        return productRepository.findAll();
    }

    @Override
    public Optional<Product> getProductById(Long id) {
        simulateFailureIfEnabled();
        return productRepository.findById(id);
    }

    @Override
    public List<Product> getProductsByCategory(String category) {
        simulateFailureIfEnabled();
        return productRepository.findByCategory(category);
    }

    @Override
    public Product createProduct(Product product) {
        simulateFailureIfEnabled();
        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(Long id) {
        simulateFailureIfEnabled();
        productRepository.deleteById(id);
    }

    // ── Demo controls (called by AdminController) ───────────────────────────

    public static void enableFailure() {
        failing = true;
        log.warn(">>> FAILURE MODE ENABLED — all requests will return 500");
    }

    public static void disableFailure() {
        failing = false;
        log.info(">>> FAILURE MODE DISABLED — server has recovered");
    }

    public static boolean isFailing() {
        return failing;
    }

    // ── Internal helper ─────────────────────────────────────────────────────

    private void simulateFailureIfEnabled() {
        if (failing) {
            throw new RuntimeException(
                "Simulated server failure! The circuit breaker should trip.");
        }
    }
}
```

## Key Design Decisions

| Decision | Reason |
|---|---|
| `static volatile boolean` | `static` → one shared flag for the whole JVM. `volatile` → guaranteed visibility across threads without synchronisation overhead. |
| `static` methods on `enableFailure` / `disableFailure` | `AdminController` can call them without needing a `ProductServiceImpl` reference — avoids circular dependency issues. |
| `RuntimeException` (unchecked) | Spring MVC catches unchecked exceptions and returns HTTP 500 by default — no extra configuration needed. |
| `@Slf4j` | Generates a `log` field via Lombok. The `log.warn` / `log.info` calls make state changes visible in the terminal. |

:::warning
**The `failing` flag is per-JVM process, not per-HTTP-request.** When you enable failure on port 8091, *all* requests to that server start failing. Ports 8092 and 8093 are unaffected because they are separate JVM processes.
:::

### Why `volatile` Matters

```
Thread A (HTTP request)         Thread B (HTTP request)
  reads failing → false           reads failing → false  ✗ cached!
  
Without volatile:
  Thread A sets failing = true
  Thread B still sees false (CPU register cache not flushed)

With volatile:
  Thread A sets failing = true → immediately written to main memory
  Thread B reads failing → true ✓
```

---

:::tip
→ Continue to **[Step 6: Create the Product Controller](step-6-product-controller)**
:::

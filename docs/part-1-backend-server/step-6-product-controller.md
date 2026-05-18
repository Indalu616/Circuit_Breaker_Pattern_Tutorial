---
sidebar_position: 7
title: "Step 6: Product Controller"
description: REST endpoints for the product catalogue
---

# Step 6: Product Controller

## Why This Class Exists

`ProductController` exposes the `ProductService` operations as HTTP endpoints. It is the **outermost layer** of the application — the only class that an HTTP request ever directly touches.

Notice that it depends on `ProductService` (the interface), not `ProductServiceImpl`. Spring's dependency injection wires in the concrete implementation at startup. The controller never needs to know which implementation it is using.

## Where to Create It

Create package `controller`, then create `ProductController.java`:

```
src/main/java/org/example/activityserver/
└── controller/
    └── ProductController.java   ← create this
```

## Code

```java
package org.example.activityserver.controller;

import lombok.RequiredArgsConstructor;
import org.example.activityserver.model.Product;
import org.example.activityserver.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing Product CRUD operations.
 *
 * All endpoints are under /api/products.
 * The controller depends on the ProductService interface —
 * it has no knowledge of ProductServiceImpl or the database.
 *
 * Endpoint map:
 *   GET    /api/products               → list all products
 *   GET    /api/products/{id}          → get one product (404 if not found)
 *   GET    /api/products/category/{c}  → filter by category
 *   POST   /api/products               → create a product (JSON body)
 *   DELETE /api/products/{id}          → delete a product
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public List<Product> getByCategory(@PathVariable String category) {
        return productService.getProductsByCategory(category);
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productService.createProduct(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Endpoint Reference

| Method | Path | Request Body | Response |
|---|---|---|---|
| `GET` | `/api/products` | — | `[{...}, {...}]` (200) |
| `GET` | `/api/products/1` | — | `{...}` (200) or empty (404) |
| `GET` | `/api/products/category/Electronics` | — | `[{...}]` (200) |
| `POST` | `/api/products` | `{"name":"...","price":9.99,"category":"..."}` | Created product (200) |
| `DELETE` | `/api/products/1` | — | Empty body (204) |

:::info
When `ProductServiceImpl.failing == true`, every one of these endpoints returns **HTTP 500**. The `simulateFailureIfEnabled()` call is the very first thing each service method does, so no database access occurs during a simulated failure.
:::

---

:::tip
→ Continue to **[Step 7: Create the Admin Controller](step-7-admin-controller)**
:::

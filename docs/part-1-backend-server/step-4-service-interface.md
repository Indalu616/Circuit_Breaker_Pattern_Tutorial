---
sidebar_position: 5
title: "Step 4: Service Interface"
description: Define the service contract using a Java interface
---

# Step 4: Service Interface

## Why a Separate Interface?

The service **interface** defines the *contract* — what operations are available — without saying anything about *how* they are implemented. The controller depends on this interface, not on the concrete class.

This separation matters for three reasons:

1. **Testability** — you can mock `ProductService` in unit tests without touching the database.
2. **Replaceability** — you can swap `ProductServiceImpl` for a different implementation (e.g. one that reads from Redis) without changing the controller.
3. **Clarity** — reading the interface tells you exactly what the service can do in seconds.

## Where to Create It

Create package `service`, then create `ProductService.java`:

```
src/main/java/org/example/activityserver/
├── model/Product.java
├── repository/ProductRepository.java
└── service/
    └── ProductService.java   ← create this
```

## Code

```java
package org.example.activityserver.service;

import org.example.activityserver.model.Product;

import java.util.List;
import java.util.Optional;

/**
 * Service contract for Product operations.
 *
 * This interface defines WHAT the service can do.
 * ProductServiceImpl defines HOW it does it.
 *
 * The controller depends only on this interface —
 * it never imports ProductServiceImpl directly.
 */
public interface ProductService {

    List<Product> getAllProducts();

    Optional<Product> getProductById(Long id);

    List<Product> getProductsByCategory(String category);

    Product createProduct(Product product);

    void deleteProduct(Long id);
}
```

:::info
`Optional<Product>` for `getProductById` is idiomatic Java — it forces callers to handle the "product not found" case explicitly instead of getting a `NullPointerException`.
:::

---

:::tip
→ Continue to **[Step 5: Create the Service Implementation](step-5-service-impl)**
:::

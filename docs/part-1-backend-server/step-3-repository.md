---
sidebar_position: 4
title: "Step 3: Product Repository"
description: Data access interface using Spring Data JPA
---

# Step 3: Product Repository

## Why This Interface Exists

`ProductRepository` is the **data access layer**. It provides all the SQL operations the service needs without you writing a single SQL statement.

Spring Data JPA reads this interface at startup and generates a complete implementation automatically — including `findAll()`, `findById()`, `save()`, `deleteById()`, and any custom methods you declare using its naming convention.

## Where to Create It

Create package `repository` alongside `model`, then create `ProductRepository.java`:

```
src/main/java/org/example/activityserver/
├── model/Product.java
└── repository/
    └── ProductRepository.java   ← create this
```

## Code

```java
package org.example.activityserver.repository;

import org.example.activityserver.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access interface for Product entities.
 *
 * JpaRepository<Product, Long> provides these methods for free:
 *   findAll()          → SELECT * FROM products
 *   findById(id)       → SELECT * FROM products WHERE id = ?
 *   save(product)      → INSERT or UPDATE
 *   deleteById(id)     → DELETE FROM products WHERE id = ?
 *   count()            → SELECT COUNT(*) FROM products
 *
 * The custom method below uses Spring Data's query derivation:
 * the method name "findByCategory" is parsed and translated to:
 *   SELECT * FROM products WHERE category = ?
 * No SQL or @Query annotation needed.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Spring Data generates the SQL from the method name automatically
    List<Product> findByCategory(String category);
}
```

## How Spring Data Query Derivation Works

Spring Data parses the method name word by word:

```
findBy  Category
  │         │
  │         └── WHERE category = ?   (matches the field name in Product)
  └── SELECT *
```

You can chain conditions: `findByCategoryAndPriceGreaterThan(String cat, Double price)` becomes `WHERE category = ? AND price > ?` — all without writing SQL.

:::info
`@Repository` is technically optional here (Spring Boot detects it via the `JpaRepository` supertype) but it is good practice to include it for clarity.
:::

---

:::tip
→ Continue to **[Step 4: Create the Service Interface](step-4-service-interface)**
:::

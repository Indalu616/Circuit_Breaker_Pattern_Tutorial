---
sidebar_position: 3
title: "Step 2: Product Model"
description: Create the JPA entity that maps to the products table
---

# Step 2: Product Model

## Why This Class Exists

`Product` is a **JPA entity** — a Java class that maps directly to a database table. Spring Boot + Hibernate read this class and automatically create the `products` table in H2 when the application starts.

Lombok annotations (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`) eliminate the roughly 50 lines of boilerplate getters, setters, and constructors that would otherwise clutter this file.

## Where to Create It

Inside `src/main/java/org/example/activityserver/`, create a new package (folder) called **`model`**, then create `Product.java` inside it:

```
src/main/java/org/example/activityserver/
└── model/
    └── Product.java   ← create this
```

## Code

```java
package org.example.activityserver.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA entity that maps to the "products" table in the H2 in-memory database.
 *
 * Hibernate reads this class at startup and runs:
 *   CREATE TABLE products (id BIGINT AUTO_INCREMENT, name VARCHAR, price DOUBLE, category VARCHAR)
 *
 * Lombok annotations replace ~50 lines of boilerplate:
 *   @Data               → generates getters, setters, toString, equals, hashCode
 *   @NoArgsConstructor  → generates Product()
 *   @AllArgsConstructor → generates Product(id, name, price, category)
 */
@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String category;
}
```

## Key Annotations

| Annotation | Effect |
|---|---|
| `@Entity` | Marks this class as a JPA-managed database table |
| `@Table(name = "products")` | Sets the table name explicitly (avoids naming surprises) |
| `@Id` | Marks `id` as the primary key |
| `@GeneratedValue(IDENTITY)` | Auto-increments the ID — the database assigns it |
| `@Column(nullable = false)` | Adds a `NOT NULL` constraint to the column |

:::info
You never need to write `CREATE TABLE` SQL. Hibernate generates and executes the DDL automatically based on this class, controlled by `spring.jpa.hibernate.ddl-auto=create-drop` in `application.properties` (configured in Step 8).
:::

---

:::tip
→ Continue to **[Step 3: Create the Repository](step-3-repository)**
:::

---
sidebar_position: 1
title: Part 1 Overview
description: Build the activity-server Spring Boot REST API
---

# Part 1 — Build the Backend Server

In Part 1 you will build **`activity-server`** — a production-quality Spring Boot REST API for a product catalogue. This server is the backend that your load balancer will route traffic to in Parts 2 and 3.

## What You Will Build

```
activity-server/
├── pom.xml
└── src/main/
    ├── java/org/example/activityserver/
    │   ├── ActivityServerApplication.java
    │   ├── model/
    │   │   └── Product.java                    ← Step 2
    │   ├── repository/
    │   │   └── ProductRepository.java          ← Step 3
    │   ├── service/
    │   │   ├── ProductService.java             ← Step 4
    │   │   └── ProductServiceImpl.java         ← Step 5
    │   └── controller/
    │       ├── ProductController.java          ← Step 6
    │       └── AdminController.java            ← Step 7
    └── resources/
        ├── application.properties              ← Step 8
        └── data.sql                            ← Step 9
```

## Layered Architecture

The server follows a standard Spring Boot **layered architecture**:

```
HTTP Request
     │
     ▼
┌─────────────────────┐
│   Controller Layer  │  ProductController, AdminController
│  (HTTP endpoints)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │  ProductService (interface)
│  (business logic)   │  ProductServiceImpl (implementation)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Repository Layer   │  ProductRepository extends JpaRepository
│  (data access)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  H2 In-Memory DB    │  Auto-created by Hibernate from Product.java
└─────────────────────┘
```

## The Key Feature for the Demo

`ProductServiceImpl` contains a **failure simulation toggle** — a `static volatile boolean` flag that, when enabled, makes every service method throw a `RuntimeException`, causing the server to return HTTP 500. This is what lets you trip the circuit breaker on demand in Part 3.

## Steps in This Part

| Step | File | What It Does |
|---|---|---|
| [Step 1](step-1-initialize) | Project setup | Spring Initializr, dependencies, `pom.xml` |
| [Step 2](step-2-model) | `Product.java` | JPA entity mapping to the `products` table |
| [Step 3](step-3-repository) | `ProductRepository.java` | Data access via Spring Data JPA |
| [Step 4](step-4-service-interface) | `ProductService.java` | Service contract (interface) |
| [Step 5](step-5-service-impl) | `ProductServiceImpl.java` | Business logic + failure simulation toggle |
| [Step 6](step-6-product-controller) | `ProductController.java` | REST endpoints for the product catalogue |
| [Step 7](step-7-admin-controller) | `AdminController.java` | Endpoints to trigger and recover from failure |
| [Step 8](step-8-configuration) | `application.properties` | Port, H2, Actuator, seed data config |
| [Step 9](step-9-seed-data) | `data.sql` | 7 seed products loaded on every startup |

---

Let's start → **[Step 1: Initialize the Project](step-1-initialize)**

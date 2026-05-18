---
sidebar_position: 9
title: "Step 8: Configuration"
description: Configure application.properties for port, H2, Actuator, and seed data
---

# Step 8: Configuration

## Why Configuration Matters

`application.properties` is where Spring Boot reads its runtime settings. For this activity, the configuration does three important things:

1. **Defines the port** — and makes it overridable via an environment variable so you can run multiple instances without editing the file each time.
2. **Configures H2** — enables the in-memory database and the browser console.
3. **Exposes the health endpoint** — `/actuator/health` is what the load balancer polls to know if this server is alive.

## File Location

```
src/main/resources/
└── application.properties   ← edit this (it already exists from the Initializr)
```

## Configuration

Replace the entire contents of `application.properties` with:

```properties
# ============================================================
# Circuit Breaker Activity — Backend Server Configuration
# ============================================================

# Port — override per instance using the JVM argument:
#   mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8092
server.port=${SERVER_PORT:8091}

spring.application.name=activity-server

# ── H2 In-Memory Database ──────────────────────────────────────────────
# H2 starts automatically inside the JVM — no external install needed.
# The database lives in memory only; data resets on every restart.
spring.datasource.url=jdbc:h2:mem:activitydb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# create-drop: Hibernate creates all tables on startup, drops them on shutdown.
spring.jpa.hibernate.ddl-auto=create-drop

# H2 browser console: open http://localhost:8091/h2-console
# JDBC URL: jdbc:h2:mem:activitydb   User: sa   Password: (empty)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# ── Seed Data ──────────────────────────────────────────────────────────
# always: run data.sql on every startup
spring.sql.init.mode=always

# CRITICAL: defer until AFTER Hibernate creates the schema.
# Without this, data.sql runs before the table exists → startup failure.
spring.jpa.defer-datasource-initialization=true

# ── Actuator ───────────────────────────────────────────────────────────
# /actuator/health is polled by the load balancer's HealthChecker.
# The load balancer checks for {"status":"UP"} in the response body.
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always

# ── Logging ────────────────────────────────────────────────────────────
logging.level.org.example.activityserver=DEBUG
```

## Port Override Reference

| Instance | Command |
|---|---|
| Instance 1 (default) | `mvn spring-boot:run` |
| Instance 2 | `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8092` |
| Instance 3 | `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8093` |

:::info
`${SERVER_PORT:8091}` means: use the `SERVER_PORT` environment variable if set; otherwise default to `8091`. This lets you also start the server with `SERVER_PORT=8092 mvn spring-boot:run` on Linux/macOS.
:::

:::danger[Critical — Read This]
**The `defer-datasource-initialization=true` line is critical.** Without it, Spring Boot runs `data.sql` before Hibernate creates the table, and the app crashes on startup with `Table "PRODUCTS" not found`.
:::

---

:::tip
→ Continue to **[Step 9: Add Seed Data](step-9-seed-data)**
:::

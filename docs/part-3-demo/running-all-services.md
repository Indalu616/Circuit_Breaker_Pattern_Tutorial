---
sidebar_position: 2
title: Running All Services
description: Start three backend instances and the load balancer, verify basic routing
---

# Running All Services

Before breaking anything, get all four processes running and confirm the baseline is clean.

---

## Step 1 — Start the Three Backend Instances

Open **three separate terminal windows** and navigate to the `activity-server` folder in each.

**Terminal 1 — port 8091 (default)**
```bash
cd activity-server
mvn spring-boot:run
```

**Terminal 2 — port 8092**
```bash
cd activity-server
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8092
```

**Terminal 3 — port 8093**
```bash
cd activity-server
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8093
```

Wait for each terminal to show:
```
Started ActivityServerApplication in 2.4 seconds (process running for 2.7)
```

:::note[📸 Image Placeholder]
Insert a screenshot of three terminal windows side by side, each showing the Spring Boot startup banner and `Started ActivityServerApplication` line for ports 8091, 8092, and 8093 respectively.
:::

---

## Step 2 — Start the Load Balancer

Open a **fourth terminal** and navigate to `activity-load-balancer`:

```bash
cd activity-load-balancer
mvn spring-boot:run
```

You should see:
```
[LoadBalancer] Registered 3 backend instance(s):
  → http://localhost:8091
  → http://localhost:8092
  → http://localhost:8093
Started ActivityLoadBalancerApplication in 1.9 seconds
```

:::note[📸 Image Placeholder]
Insert a screenshot of Terminal 4 showing the load balancer startup output, specifically the three `→ http://localhost:...` lines confirming all three backends were registered.
:::

---

## Step 3 — Verify Each Backend Directly

Open a fifth terminal (or any that is not running a server). Run these three commands:

```bash
curl http://localhost:8091/api/products
curl http://localhost:8092/api/products
curl http://localhost:8093/api/products
```

All three should return the same 7-product JSON array:

```json
[
  {"id":1,"name":"Laptop","price":1299.99,"category":"Electronics"},
  {"id":2,"name":"Keyboard","price":79.99,"category":"Electronics"},
  {"id":3,"name":"Desk Chair","price":249.0,"category":"Furniture"},
  {"id":4,"name":"Monitor","price":399.99,"category":"Electronics"},
  {"id":5,"name":"Notebook","price":4.99,"category":"Stationery"},
  {"id":6,"name":"Pen Set","price":9.99,"category":"Stationery"},
  {"id":7,"name":"Bookshelf","price":149.0,"category":"Furniture"}
]
```

:::warning
If you see `Table "PRODUCTS" not found` in the logs, check that `spring.jpa.defer-datasource-initialization=true` is in `application.properties`. See [Step 8 of Part 1](../part-1-backend-server/step-8-configuration).
:::

---

## Step 4 — Verify Routing Through the Load Balancer

```bash
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
curl http://localhost:8080/api/products
```

All four should return the same product list. Behind the scenes the load balancer cycled:
- Request 1 → port **8091**
- Request 2 → port **8092**
- Request 3 → port **8093**
- Request 4 → port **8091** (cycle restarts)

---

## Step 5 — Check the Circuit Breaker Dashboard

```bash
curl http://localhost:8080/lb/status
```

All three instances should show `"circuitBreakerState": "CLOSED"`:

```json
{
  "availableInstances": 3,
  "totalInstances": 3,
  "instances": [
    {
      "url": "http://localhost:8091",
      "healthy": true,
      "available": true,
      "activeRequests": 0,
      "circuitBreakerState": "CLOSED",
      "failureCount": 0,
      "failureThreshold": 3,
      "totalRequests": 2,
      "totalFailures": 0,
      "remainingTimeoutMs": 0
    },
    {
      "url": "http://localhost:8092",
      "healthy": true,
      "available": true,
      "circuitBreakerState": "CLOSED",
      "failureCount": 0,
      "totalRequests": 1,
      "totalFailures": 0,
      "remainingTimeoutMs": 0
    },
    {
      "url": "http://localhost:8093",
      "healthy": true,
      "available": true,
      "circuitBreakerState": "CLOSED",
      "failureCount": 0,
      "totalRequests": 1,
      "totalFailures": 0,
      "remainingTimeoutMs": 0
    }
  ]
}
```

:::note[📸 Image Placeholder]
Insert a screenshot of the `/lb/status` JSON response in a browser with a JSON formatter, showing all three instances as `CLOSED` with `failureCount: 0`. This is the baseline state.
:::

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `Connection refused` on port 8080 | Load balancer not started | Run `mvn spring-boot:run` in `activity-load-balancer/` |
| `Connection refused` on 8091/8092/8093 | Backend not started | Start it in the correct terminal |
| Empty product list `[]` | H2 `data.sql` not loaded | Check `spring.jpa.defer-datasource-initialization=true` |
| `curl: command not found` (Windows) | Use PowerShell instead | `Invoke-WebRequest -Uri http://localhost:8080/api/products \| Select-Object -ExpandProperty Content` |

---

✅ **Baseline confirmed.** All three backends respond, all circuit breakers are `CLOSED`, load balancer routes correctly.

→ **[Next: Triggering Failure](triggering-failure)**

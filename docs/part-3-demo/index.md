---
sidebar_position: 1
title: Part 3 Overview
description: Run all services and observe the circuit breaker in action
---

# Part 3 — Run & Demo

This is where the circuit breaker comes alive. You will start all four processes, inject a controlled failure, and watch the circuit breaker trip and automatically recover — all in real time.

## What You Will Observe

```mermaid
sequenceDiagram
    participant C as Client (curl)
    participant LB as Load Balancer :8080
    participant CB as CircuitBreaker
    participant S1 as Server :8091
    participant S2 as Server :8092

    Note over S1: 1. Normal operation
    C->>LB: GET /api/products
    LB->>CB: canAttemptRequest(8091)?
    CB-->>LB: true (CLOSED)
    LB->>S1: forward request
    S1-->>LB: 200 OK
    LB-->>C: 200 OK

    Note over S1: 2. Failure injected
    C->>S1: POST /admin/fail
    S1-->>C: OK (failure mode ON)

    C->>LB: GET /api/products (×3)
    LB->>S1: forward (hits 8091 on round-robin)
    S1-->>LB: 500 (×3)
    LB->>CB: recordFailure() ×3
    CB-->>CB: CLOSED → OPEN

    Note over LB: 3. Circuit OPEN — traffic rerouted
    C->>LB: GET /api/products
    LB->>CB: canAttemptRequest(8091)?
    CB-->>LB: false (OPEN)
    LB->>S2: forward to 8092 instead
    S2-->>C: 200 OK

    Note over CB: 4. Timeout expires → HALF_OPEN
    Note over S1: POST /admin/recover
    C->>LB: GET /api/products (probe)
    LB->>CB: canAttemptRequest(8091)?
    CB-->>LB: true (HALF_OPEN)
    LB->>S1: probe request
    S1-->>LB: 200 OK
    LB->>CB: recordSuccess()
    CB-->>CB: HALF_OPEN → CLOSED
```

## Demo Checklist

| Step | File | What You Do |
|---|---|---|
| [Running All Services](running-all-services) | Steps 19–20 | Start 3 backend instances + load balancer. Verify basic routing. |
| [Triggering Failure](triggering-failure) | Test 2 | Crash one server, send requests, watch the breaker trip to OPEN |
| [Observing the Breaker](observing-circuit-breaker) | Dashboard | Read `/lb/status` and understand every field |
| [Recovery Demo](recovery-demo) | Test 3 | Recover the server, watch OPEN → HALF_OPEN → CLOSED |

## Terminal Layout

Keep **four terminal windows** open simultaneously throughout this part:

```
┌─────────────────────┐ ┌─────────────────────┐
│  Terminal 1         │ │  Terminal 2         │
│  activity-server    │ │  activity-server    │
│  port 8091          │ │  port 8092          │
└─────────────────────┘ └─────────────────────┘
┌─────────────────────┐ ┌─────────────────────┐
│  Terminal 3         │ │  Terminal 4         │
│  activity-server    │ │  activity-load-     │
│  port 8093          │ │  balancer :8080     │
└─────────────────────┘ └─────────────────────┘
```

:::info
Do not close any terminal between tests. All four processes must run simultaneously.
:::

---

Start here → **[Running All Services](running-all-services)**

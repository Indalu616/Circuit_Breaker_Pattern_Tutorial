---
sidebar_position: 1
title: Overview
description: CSC408 – Circuit Breaker Activity Overview
---

# CSC408 – Improving System Reliability Using the Circuit Breaker Pattern


## Overview

In this activity you will design, implement, and observe a **Circuit Breaker** — one of the most important reliability patterns in modern distributed systems. You will build two independent Spring Boot applications that work together:

1. **`activity-server`** — A simple product catalogue REST API that can simulate a server outage.
2. **`activity-load-balancer`** — A reverse proxy that distributes requests across multiple server instances, equipped with a **per-instance Circuit Breaker** that detects failures and stops routing traffic to unhealthy servers.

By the end of this activity you will observe — in real time — how a circuit breaker transitions through its three states (`CLOSED → OPEN → HALF_OPEN → CLOSED`) and prevents cascading failures in a distributed system.

---

## Objectives

By the end of this activity, students should be able to:

- Explain the purpose of the Circuit Breaker pattern and the problem it solves.
- Describe the three states of a circuit breaker and the transitions between them.
- Implement a thread-safe, per-instance circuit breaker from scratch in Java.
- Integrate a circuit breaker into a custom load balancer that forwards HTTP requests.
- Simulate server failure and observe the automatic circuit breaker response.
- Observe `OPEN → HALF_OPEN → CLOSED` recovery without manual intervention.
- Monitor system health in real time via the `/lb/status` endpoint.
- Articulate how industry systems (Netflix, Amazon, Uber) apply this pattern at scale.

---

## System Architecture

The diagram below illustrates the complete system you will build.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                      CLIENT (curl / Postman)                    │
 └──────────────────────────────┬──────────────────────────────────┘
                                │  HTTP :8080
                                ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │             LOAD BALANCER  (activity-load-balancer)             │
 │                         port 8080                               │
 │                                                                 │
 │  ┌───────────────────────────────────────────────────────────┐  │
 │  │  ProxyController  →  LoadBalancer  →  BackendInstance     │  │
 │  │                                          CircuitBreaker   │  │
 │  └───────────────────────────────────────────────────────────┘  │
 │  ┌───────────────────────────────────────────────────────────┐  │
 │  │  HealthChecker  (polls /actuator/health every 5 s)        │  │
 │  └───────────────────────────────────────────────────────────┘  │
 └──────────┬────────────────────┬────────────────────┬────────────┘
            │                    │                    │
     HTTP :8091           HTTP :8092           HTTP :8093
            │                    │                    │
 ┌──────────▼──────┐   ┌─────────▼───────┐   ┌───────▼─────────┐
 │ Server Instance │   │ Server Instance │   │ Server Instance  │
 │   (port 8091)   │   │   (port 8092)   │   │   (port 8093)    │
 │ activity-server │   │ activity-server │   │ activity-server  │
 └─────────────────┘   └─────────────────┘   └─────────────────┘
```

Each server instance runs the **same `activity-server` JAR** on a different port. The load balancer maintains one independent **Circuit Breaker per instance** — a failure on port `8091` does not affect traffic to `8092` or `8093`.

## Prerequisites

Before starting, make sure you have:

| Tool         | Minimum Version | How to Verify                                                          |
| ------------ | --------------- | ---------------------------------------------------------------------- |
| Java (JDK)   | 17              | `java --version`                                                       |
| Apache Maven | 3.8             | `mvn --version`                                                        |
| IDE          | Any             | IntelliJ IDEA (recommended), Eclipse, or VS Code + Java Extension Pack |
| curl         | Any             | `curl --version`                                                       |

You will need **four separate terminal windows** open simultaneously during Part 3:

| Terminal   | Purpose                               |
| ---------- | ------------------------------------- |
| Terminal 1 | `activity-server` on port 8091        |
| Terminal 2 | `activity-server` on port 8092        |
| Terminal 3 | `activity-server` on port 8093        |
| Terminal 4 | `activity-load-balancer` on port 8080 |

---

## Activity Structure

| Part                                 | What You Build                                                      |
| ------------------------------------ | ------------------------------------------------------------------- |
| **[Part 1](part-1-backend-server/)** | The backend server — a layered REST API for a product catalogue     |
| **[Part 2](part-2-load-balancer/)**  | The load balancer — a reverse proxy with a built-in circuit breaker |
| **[Part 3](part-3-demo/)**           | Run everything and observe failure + recovery in real time          |

Ready? Continue to **[Background & Theory →](background)**

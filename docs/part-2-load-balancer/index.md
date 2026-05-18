---
sidebar_position: 1
title: Part 2 Overview
description: Build the activity-load-balancer with circuit breaker
---

# Part 2 — Build the Load Balancer

In Part 2 you will build **`activity-load-balancer`** — a custom reverse proxy that distributes requests across the three backend instances from Part 1, with a **per-instance circuit breaker** that detects failures and stops routing traffic to unhealthy servers.

## What You Will Build

```
activity-load-balancer/
├── pom.xml
└── src/main/
    ├── java/org/example/activitylb/
    │   ├── ActivityLoadBalancerApplication.java   (auto-generated + @EnableScheduling)
    │   ├── CircuitBreakerState.java               ← Step 2
    │   ├── CircuitBreaker.java                    ← Step 3
    │   ├── BackendInstance.java                   ← Step 4
    │   ├── LoadBalancer.java                      ← Step 5
    │   ├── HealthChecker.java                     ← Step 6
    │   ├── ProxyController.java                   ← Step 7
    │   └── StatusController.java                  ← Step 8
    └── resources/
        └── application.properties                 ← Step 9
```

## Class Responsibilities

```
Incoming HTTP Request
        │
        ▼
┌───────────────────┐
│  ProxyController  │  Catches ALL requests (/**)
│  (@RequestMapping │  Asks LoadBalancer for a server
│     "/**")        │  Forwards request, records result
└────────┬──────────┘
         │ selectInstance()
         ▼
┌───────────────────┐
│   LoadBalancer    │  Round-robin selection
│   (@Component)    │  Skips unavailable instances
└────────┬──────────┘
         │ isAvailable()?
         ▼
┌───────────────────┐
│  BackendInstance  │  Bundles: URL + health flag + CircuitBreaker
└────────┬──────────┘
         │ canAttemptRequest()?
         ▼
┌───────────────────┐
│  CircuitBreaker   │  State machine: CLOSED / OPEN / HALF_OPEN
│                   │  Thread-safe via AtomicReference, AtomicInteger
└───────────────────┘

Background thread:
┌───────────────────┐
│  HealthChecker    │  Polls /actuator/health every 5s
│  (@Scheduled)     │  Force-closes circuit on recovery
└───────────────────┘

Dashboard:
┌───────────────────┐
│ StatusController  │  GET /lb/status — real-time circuit breaker view
└───────────────────┘
```

## Steps in This Part

| Step | File | What It Does |
|---|---|---|
| [Step 1](step-1-initialize) | Project setup | Spring Initializr, `@EnableScheduling` |
| [Step 2](step-2-circuit-breaker-state) | `CircuitBreakerState.java` | Enum: CLOSED / OPEN / HALF_OPEN |
| [Step 3](step-3-circuit-breaker) | `CircuitBreaker.java` | The state machine engine — atomic, thread-safe |
| [Step 4](step-4-backend-instance) | `BackendInstance.java` | Bundles URL + health + circuit breaker per server |
| [Step 5](step-5-load-balancer) | `LoadBalancer.java` | Round-robin selection with circuit-breaker awareness |
| [Step 6](step-6-health-checker) | `HealthChecker.java` | Background polling of `/actuator/health` |
| [Step 7](step-7-proxy-controller) | `ProxyController.java` | HTTP request forwarding using Java's built-in `HttpClient` |
| [Step 8](step-8-status-controller) | `StatusController.java` | Real-time dashboard at `/lb/status` |
| [Step 9](step-9-configuration) | `application.properties` | Backend URLs, circuit breaker thresholds, health check interval |

---

Let's start → **[Step 1: Initialize the Load Balancer Project](step-1-initialize)**

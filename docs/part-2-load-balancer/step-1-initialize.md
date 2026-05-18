---
sidebar_position: 2
title: "Step 1: Initialize the Project"
description: Set up activity-load-balancer using Spring Initializr
---

# Step 1: Initialize the Load Balancer Project

## Spring Initializr

Open [https://start.spring.io](https://start.spring.io) again for the **second project**:

| Setting | Value |
|---|---|
| **Project** | Maven Project |
| **Language** | Java |
| **Spring Boot** | 3.4.5 |
| **Group** | `org.example` |
| **Artifact** | `activity-load-balancer` |
| **Name** | `activity-load-balancer` |
| **Package name** | `org.example.activitylb` |
| **Packaging** | Jar |
| **Java** | 17 |

## Dependencies to Add

| Dependency | Why |
|---|---|
| **Spring Web** | REST controllers + embedded Tomcat |
| **Spring Boot Actuator** | The load balancer's own `/actuator/health` endpoint |

:::danger[Do NOT add Apache HttpClient]
Adding `httpclient5` alongside Spring Boot's embedded Tomcat causes a `Connection reset` / header unmarshalling error at runtime. This project uses `java.net.http.HttpClient` — which is part of the Java 11+ standard library. Zero extra dependencies needed.
:::

## Enable Scheduling

After generating and opening the project, open `ActivityLoadBalancerApplication.java` and add `@EnableScheduling`. This annotation is required for `HealthChecker`'s `@Scheduled` method to run:

```java
package org.example.activitylb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // ← required for HealthChecker's background polling
public class ActivityLoadBalancerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ActivityLoadBalancerApplication.class, args);
    }
}
```



## Verify the `pom.xml`

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!--
        No Apache HttpClient needed.
        We use java.net.http.HttpClient (built into Java 11+).
        Adding httpclient5 here causes a "Connection reset" runtime error.
    -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

:::tip
→ Continue to **[Step 2: Create CircuitBreakerState](step-2-circuit-breaker-state)**
:::

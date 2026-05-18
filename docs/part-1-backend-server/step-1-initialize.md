---
sidebar_position: 2
title: "Step 1: Initialize the Project"
description: Set up activity-server using Spring Initializr
---

# Step 1: Initialize the Project

## Spring Initializr

Open [https://start.spring.io](https://start.spring.io) in your browser and configure the project as follows:

| Setting | Value |
|---|---|
| **Project** | Maven Project |
| **Language** | Java |
| **Spring Boot** | 3.4.5 |
| **Group** | `org.example` |
| **Artifact** | `activity-server` |
| **Name** | `activity-server` |
| **Description** | Simple backend server for Circuit Breaker activity |
| **Package name** | `org.example.activityserver` |
| **Packaging** | Jar |
| **Java** | 17 |
## Dependencies to Add

Click **ADD DEPENDENCIES** and search for and add each of the following:

| Dependency | Why |
|---|---|
| **Spring Web** | Enables REST controllers and the embedded Tomcat server |
| **Spring Data JPA** | Provides repositories and Hibernate ORM |
| **H2 Database** | Embedded in-memory database — zero installation required |
| **Spring Boot Actuator** | Provides `/actuator/health` polled by the load balancer |
| **Lombok** | Eliminates boilerplate getters, setters, constructors |


## Generate and Open

Click **GENERATE**, download the ZIP, extract it, and open the folder in your IDE.


## Verify the `pom.xml`

Your generated `pom.xml` should contain these dependencies:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

:::tip[Project created]
→ Continue to **[Step 2: Create the Product Model](step-2-model)**
:::

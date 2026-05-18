---
sidebar_position: 10
title: "Step 9: Seed Data"
description: Populate the H2 database with sample products on startup
---

# Step 9: Seed Data

## Why Seed Data

When the application starts, the H2 database is empty. Without seed data, `GET /api/products` would return an empty array `[]` — not very interesting for a demo.

`data.sql` is loaded by Spring Boot automatically after Hibernate creates the schema (thanks to `defer-datasource-initialization=true` from Step 8). It runs every time the application starts.

## File Location

Create a new file in the same folder as `application.properties`:

```
src/main/resources/
├── application.properties
└── data.sql   ← create this
```

## Code

```sql
-- Seed data loaded automatically on every application startup.
-- Browse this data at http://localhost:<PORT>/h2-console
-- JDBC URL: jdbc:h2:mem:activitydb   User: sa   Password: (empty)

INSERT INTO products (name, price, category) VALUES ('Laptop',      1299.99, 'Electronics');
INSERT INTO products (name, price, category) VALUES ('Keyboard',      79.99, 'Electronics');
INSERT INTO products (name, price, category) VALUES ('Desk Chair',   249.00, 'Furniture');
INSERT INTO products (name, price, category) VALUES ('Monitor',      399.99, 'Electronics');
INSERT INTO products (name, price, category) VALUES ('Notebook',       4.99, 'Stationery');
INSERT INTO products (name, price, category) VALUES ('Pen Set',        9.99, 'Stationery');
INSERT INTO products (name, price, category) VALUES ('Bookshelf',    149.00, 'Furniture');
```

## Verify (Optional)

After completing Part 3 Step 19 and starting the server, you can browse the data visually:

1. Open `http://localhost:8091/h2-console`
2. JDBC URL: `jdbc:h2:mem:activitydb`
3. User: `sa` — Password: *(leave empty)*
4. Click **Connect**, then run: `SELECT * FROM products;`

:::note[📸 Image Placeholder]
Insert a screenshot of the H2 Console showing the `products` table results. Include the JDBC URL field filled in and the query results visible.
:::

---

:::tip[Part 1 complete!]
The backend server is fully built. Before moving to Part 2, do a quick sanity check — all of these files should now exist:

- `src/main/resources/application.properties`
- `src/main/resources/data.sql`
- Six Java classes across `model/`, `repository/`, `service/`, `controller/`

→ **[Part 2: Build the Load Balancer](../part-2-load-balancer/)**
:::

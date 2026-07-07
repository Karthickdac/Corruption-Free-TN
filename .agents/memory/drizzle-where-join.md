---
name: Drizzle count query join requirement
description: Count queries must join every table referenced in the WHERE clause
---

When a WHERE condition references a column from a joined table (e.g., `ilike(usersTable.name, ...)`), both the data query AND the count query must include that join.

**Why:** Drizzle compiles the WHERE condition into SQL literally. If the count query starts from `from(complaintsTable)` but WHERE references `users.name`, PostgreSQL errors: `column users.name does not exist`.

**How to apply:** When adding a filter on a joined table, wrap the count query in a conditional that adds the same join:

```ts
(filterOnJoinedTable
  ? db.select({ count: count() }).from(mainTable)
      .leftJoin(joinedTable, eq(mainTable.fk, joinedTable.id))
      .where(where)
  : db.select({ count: count() }).from(mainTable).where(where)
),
```

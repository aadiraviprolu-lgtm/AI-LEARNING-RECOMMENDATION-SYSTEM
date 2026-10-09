# Database Schema / ER Diagram

PostgreSQL, 3rd normal form. Source of truth: [`backend/db/schema.sql`](../backend/db/schema.sql).

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ TASKS : contains
    USERS {
        uuid id PK
        varchar full_name
        varchar email "unique (case-insensitive)"
        varchar password_hash "bcrypt, cost 12"
        timestamptz created_at
    }
    PROJECTS {
        uuid id PK
        uuid owner_id FK "-> users.id ON DELETE CASCADE"
        varchar name
        text description
        varchar status "Not Started | In Progress | Completed"
        date start_date
        date end_date "CHECK end_date >= start_date"
        timestamptz created_at
    }
    TASKS {
        uuid id PK
        uuid project_id FK "-> projects.id ON DELETE CASCADE"
        varchar name
        text description
        varchar priority "Low | Medium | High"
        varchar status "Pending | In Progress | Completed"
        date due_date
        timestamptz created_at
    }
    REVOKED_TOKENS {
        uuid jti PK "JWT id of a logged-out token"
        timestamptz expires_at
    }
```

## Design notes
- **Ownership chain:** `users -> projects -> tasks`. Tasks have no `owner_id`; every task query joins through `projects.owner_id`, so a task can never be accessed without owning its project (no duplicated ownership data to drift out of sync).
- **Integrity:** foreign keys with `ON DELETE CASCADE`; `CHECK` constraints enforce the status / priority enums and date ordering even if the API were bypassed.
- **Indexes:** `projects(owner_id)`, `tasks(project_id)`, `tasks(status)`, unique `lower(email)`.
- **Logout:** `revoked_tokens` stores the `jti` of logged-out JWTs until they expire; the auth middleware rejects them.

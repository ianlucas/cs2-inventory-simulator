# VIP table schema (MySQL)

Operator must create these tables; the app does not run migrations.

## vip_pending

Stores pending PayTR orders when get-token is called. The callback looks up by `merchant_oid` to get email and package info before inserting into `vip`.

| Column                   | Type         | Notes                    |
|--------------------------|--------------|--------------------------|
| merchant_oid             | VARCHAR(255) | Primary key              |
| email                    | VARCHAR(255) | Customer email           |
| package_duration_months  | INT          | 1, 3, or 6               |
| amount_cents              | INT          | Amount in kuruş          |
| created_at                | DATETIME     | When order was created   |

## vip

Stores confirmed VIP purchases. Callback inserts here on success (after hash verification and idempotency check).

| Column                   | Type         | Notes                    |
|--------------------------|--------------|--------------------------|
| merchant_oid             | VARCHAR(255) | Unique (idempotency key) |
| email                    | VARCHAR(255) | Customer email           |
| package_duration_months  | INT          | 1, 3, or 6               |
| expires_at               | DATETIME     | VIP expiry               |
| created_at               | DATETIME     | When record was created  |

## CREATE TABLE snippets (MySQL)

```sql
CREATE TABLE vip_pending (
  merchant_oid VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  package_duration_months INT NOT NULL,
  amount_cents INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vip (
  merchant_oid VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  package_duration_months INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

# API Overview

All endpoints except login require `Authorization: Bearer <access_token>`.

Localized responses use the authenticated user's `preferred_language` first, then `Accept-Language`, then English. The frontend sends `Accept-Language` automatically.

## Authentication

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/` with `{ "preferred_language": "en" | "ar" }`

## Core Resources

- `GET|POST /api/users/`
- `GET|PATCH|DELETE /api/users/{id}/`
- `GET|POST /api/projects/`
- `GET|PATCH|DELETE /api/projects/{id}/`
- `GET /api/projects/{id}/summary/`
- `GET|POST /api/categories/`
- `PATCH|DELETE /api/categories/{id}/`
- `GET|POST /api/vendors/`
- `GET|PATCH|DELETE /api/vendors/{id}/`

## Finance Workflow

- `GET|POST /api/expenses/`
- `GET|PATCH|DELETE /api/expenses/{id}/`
- `POST /api/expenses/{id}/submit/`
- `POST /api/expenses/{id}/approve/`
- `POST /api/expenses/{id}/reject/`
- `GET /api/expenses/{id}/payments/`
- `GET /api/expenses/{id}/attachments/`
- `GET /api/expenses/{id}/approval-logs/`
- `GET|POST /api/payments/`
- `GET|PATCH|DELETE /api/payments/{id}/`
- `GET|POST /api/cash-in/`
- `GET|PATCH|DELETE /api/cash-in/{id}/`

## Attachments

- `POST /api/attachments/`
- `GET /api/attachments/{id}/download/`
- `DELETE /api/attachments/{id}/`

Allowed extensions: PDF, JPG, JPEG, PNG, XLSX, DOCX.

## Dashboard

- `GET /api/dashboard/overview/`
- `GET /api/dashboard/project/{project_id}/`
- `GET /api/dashboard/monthly-costs/`
- `GET /api/dashboard/category-costs/`
- `GET /api/dashboard/paid-vs-pending/`
- `GET /api/dashboard/top-vendors/`

## Reports

- `GET /api/reports/project-summary/`
- `GET /api/reports/monthly-cost/`
- `GET /api/reports/category-cost/`
- `GET /api/reports/vendor-statement/`
- `GET /api/reports/pending-payments/`
- `GET /api/reports/cash-flow/`
- `GET /api/reports/export/excel/?report=project-summary`
- `GET /api/reports/export/pdf/?report=project-summary`

## Common Filters

List endpoints support pagination, search, ordering, and resource filters.

Expense filters:

- `project`
- `category`
- `vendor`
- `month=YYYY-MM`
- `date_from`
- `date_to`
- `approval_status`
- `payment_status`
- `created_by`
- `min_amount`
- `max_amount`
- `search`
- `ordering`

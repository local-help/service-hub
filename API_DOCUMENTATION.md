# LocalHelp REST API Documentation (v1)

Base URL: `http://localhost:3000/api/v1`

All authenticated requests must include the header:
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### Register Customer
- **Endpoint:** `POST /auth/register`
- **Body:**
  ```json
  {
    "name": "Arjun Das",
    "email": "arjun@example.com",
    "phone": "+919876501234",
    "password": "Password@123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Registration successful",
    "user": { "id": 1, "name": "Arjun Das", "email": "arjun@example.com", "role": "customer" },
    "access_token": "eyJhbGciOi...",
    "refresh_token": "a1b2c3d4..."
  }
  ```

### Email Login
- **Endpoint:** `POST /auth/login`
- **Body:** `{ "email": "user@example.com", "password": "Password@123" }`
- **Response (200 OK):** `{ "user": {...}, "access_token": "...", "refresh_token": "..." }`

### Send Mobile OTP
- **Endpoint:** `POST /auth/otp/send`
- **Body:** `{ "phone": "+919876543210" }`
- **Response (200 OK):** `{ "message": "OTP sent successfully", "cooldown": 60 }`

### Verify Mobile OTP
- **Endpoint:** `POST /auth/otp/verify`
- **Body:** `{ "phone": "+919876543210", "otp": "123456" }`
- **Response (200 OK):** `{ "user": {...}, "access_token": "...", "refresh_token": "...", "is_new_user": false }`

### Refresh Access Token
- **Endpoint:** `POST /auth/refresh`
- **Body:** `{ "refresh_token": "a1b2c3d4..." }`
- **Response (200 OK):** `{ "access_token": "...", "refresh_token": "..." }`

### Current User Profile
- **Endpoint:** `GET /auth/me` (Authenticated)
- **Response (200 OK):** `{ "user": { "id": 1, "name": "...", "role": "..." } }`

---

## 2. Public Endpoints

### List Categories
- **Endpoint:** `GET /categories`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Car Cleaning & Maintenance",
      "description": "...",
      "icon_name": "car",
      "services_count": 3
    }
  ]
  ```

### List / Search Services
- **Endpoint:** `GET /services?category_id=1&q=wash&page=1`
- **Response (200 OK):** Array of service objects with pagination meta.

### Platform Support Information
- **Endpoint:** `GET /platform/support_info`
- **Response (200 OK):**
  ```json
  {
    "phone": "+919876543210",
    "whatsapp": "+919876543210",
    "platform_name": "LocalHelp"
  }
  ```

---

## 3. Customer Service Requests & Quotations

### Create Service Request
- **Endpoint:** `POST /service_requests` (Customer)
- **Body:**
  ```json
  {
    "service_id": 1,
    "address_id": 4,
    "description": "Kitchen tap leaking continuously",
    "preferred_at": "2026-11-06T10:00:00Z"
  }
  ```
- **Response (201 Created):** Full ServiceRequest detail with `reference_number` (e.g. `LH-48291`).

### View Quotation for Request
- **Endpoint:** `GET /service_requests/:id/quotation` (Customer / Admin)

### Approve Quotation
- **Endpoint:** `POST /service_requests/:id/quotation/approve` (Customer)
- **Response (200 OK):** Auto-confirms booking, updates request status to `booking_confirmed`.

### Reject Quotation
- **Endpoint:** `POST /service_requests/:id/quotation/reject` (Customer)

---

## 4. Bookings & Payments

### List Bookings
- **Endpoint:** `GET /bookings?status=confirmed` (Customer)

### Initiate Payment Order
- **Endpoint:** `POST /bookings/:id/payments/initiate` (Customer)
- **Response (201 Created):** Returns gateway order info, payable amount, and payment record.

### Verify Payment
- **Endpoint:** `POST /bookings/:id/payments/verify` (Customer)
- **Body:** `{ "gateway_order_id": "...", "gateway_reference": "...", "signature": "..." }`
- **Response (200 OK):** Marks payment `paid` idempotently.

---

## 5. Admin Management Endpoints

All admin endpoints require `role: admin` or `role: super_admin`.

### Dashboard Metrics
- **Endpoint:** `GET /admin/dashboard`
- **Response (200 OK):** Total requests, counts by status, confirmed/in_progress bookings, total revenue, active providers.

### Manage Service Requests
- **List:** `GET /admin/service_requests?status=pending_review&q=LH-`
- **Assign Provider:** `POST /admin/service_requests/:id/assign_provider` with `{ "provider_id": 2 }`
- **Update Status:** `PATCH /admin/service_requests/:id` with `{ "status": "...", "admin_notes": "..." }`

### Manage Quotations
- **Create Quotation (One per request):** `POST /admin/quotations/:service_request_id`
  - Body: `{ "amount": 750.00, "description": "...", "valid_until": "..." }`
- **Update Quotation:** `PATCH /admin/quotations/:id`

### Record Communication (Phone & WhatsApp)
- **Endpoint:** `POST /admin/service_requests/:id/communications`
- **Body:**
  ```json
  {
    "channel": "whatsapp",
    "direction": "outbound",
    "summary": "Shared provider arrival schedule",
    "outcome": "Customer acknowledged and confirmed presence"
  }
  ```

### Record Offline Payment
- **Endpoint:** `POST /admin/payments/record_offline`
- **Body:** `{ "booking_id": 1, "amount": 750.00, "offline_type": "cash", "notes": "Received cash upon completion" }`


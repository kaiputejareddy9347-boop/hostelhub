# HostelHub - Spring Boot Backend

HostelHub is a full-featured Hostel, PG, Room & Mess Management System built with **Java 17**, **Spring Boot 3.2**, **Spring Security (JWT)**, **Spring Data JPA (Hibernate)**, and **PostgreSQL**.

---

## 🛠️ Tech Stack & Features

- **Java 17 & Spring Boot 3.2**
- **Spring Data JPA / Hibernate ORM**
- **Spring Security** with Stateless JWT Authentication & Role-Based Access Control (`STUDENT`, `OWNER`, `ADMIN`)
- **PostgreSQL Database** (Neon PostgreSQL compatible schema)
- **Automatic Facility Seeding** on Startup
- **RESTful Endpoints** strictly adhering to frontend contract

---

## 🚀 How to Run

### Prerequisites
- **JDK 17 or higher** installed (`java -version`)
- **Maven 3.8+** or use the included `./mvnw` script

### 1. Configure Environment Variables
Set your `DATABASE_URL` environment variable or edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=postgresql://neondb_owner:npg_tVdQx65eLOcR@ep-long-rice-az6ssy8l-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Build and Run
Using Maven:
```bash
mvn spring-boot:run
```
Or using Maven Wrapper:
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

The server will start on port `8080`: `http://localhost:8080/api`

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user (`STUDENT` or `OWNER`)
- `POST /api/auth/login` - User login (returns JWT token & profile details)

### 🏨 Hostels & Properties (`/api/hostels`)
- `GET /api/hostels` - List all hostels (optional filter `?city=...`)
- `GET /api/hostels/owner` - List hostels owned by authenticated user
- `GET /api/hostels/{id}` - Get single hostel details with rooms, facilities, images, reviews
- `POST /api/hostels` - Create a new hostel listing (Owner only)
- `POST /api/hostels/{id}/rooms` - Add a room/plan to hostel (Owner only)
- `POST /api/hostels/{id}/expenses` - Record an expense for a hostel (Owner only)

### 📅 Bookings (`/api/bookings`)
- `POST /api/bookings` - Create a new booking request (Student only)
- `GET /api/bookings/student` - Get student's active and past bookings
- `GET /api/bookings/owner` - Get bookings for owner's hostels
- `PUT /api/bookings/{id}/status` - Accept/Reject booking request (Owner only)
- `PUT /api/bookings/{id}/terminate` - Terminate an active stay (Owner only)
- `PUT /api/bookings/{id}/checkout-date` - Extend checkout date (Student only)

### 🧾 Invoices (`/api/invoices`)
- `GET /api/invoices/student` - View student invoices
- `GET /api/invoices/owner` - View owner invoices grouped by hostel

### 💳 Payments (`/api/payments`)
- `POST /api/payments` - Process invoice payment (Transaction ID or Screenshot)
- `GET /api/payments/student` - Get student payment history
- `GET /api/payments/owner` - Get owner payment history

### 📢 Complaints (`/api/complaints`)
- `POST /api/complaints` - Log a new complaint (Student only)
- `GET /api/complaints/student` - View student complaints
- `GET /api/complaints/owner` - View complaints for owner's hostels
- `PUT /api/complaints/{id}/reply` - Reply and resolve complaint (Owner only)

### 🛜 Facilities (`/api/facilities`)
- `GET /api/facilities` - List all system facilities

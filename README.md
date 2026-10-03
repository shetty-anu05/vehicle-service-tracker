# 🚗 VehicleCare

## Vehicle Service Management System

VehicleCare is a full-stack **Vehicle Service Management System** developed to simplify and organize vehicle servicing operations through a centralized web application.

The system allows administrators and users to manage vehicles, customers, service records, appointments, invoices, and service-related information from a single dashboard.

---

## 📌 Project Overview

Managing vehicle service information manually can be time-consuming and difficult to maintain. VehicleCare provides a digital solution where vehicle and customer information can be stored, updated, and accessed efficiently.

The application provides:

- Vehicle management
- Customer management
- Service management
- Appointment scheduling
- Invoice management
- Dashboard analytics
- Authentication and authorization
- Service history tracking
- Reports and data visualization

---

# ✨ Features

## 🔐 Authentication

- User Login
- User Signup
- Custom username registration
- JWT-based authentication
- Access token and refresh token
- Protected API routes
- Admin authentication
- Logout functionality

---

## 🚗 Vehicle Management

VehicleCare allows users to manage complete vehicle information.

Features include:

- Add new vehicles
- View vehicle details
- Vehicle number
- Vehicle model
- Vehicle type
- Owner information
- Customer phone number
- Last service date
- Next service date
- Service cost
- Service status
- Search and filter vehicles

---

## 👤 Customer Management

The customer module allows users to maintain customer information.

Features include:

- Add customers
- View customer records
- Customer name
- Phone number
- Email address
- Address
- Delete customer records

---

## 🔧 Service Management

Vehicle service records can be maintained through the service module.

Features include:

- Add service records
- Select vehicle
- Select service type
- Technician information
- Parts cost
- Labour cost
- Service description
- Service date
- Next service date
- Service history

---

## 📅 Appointment Management

The appointment module allows users to schedule and manage vehicle servicing appointments.

Features include:

- Book appointments
- Customer selection
- Vehicle selection
- Service type
- Appointment date
- Appointment time
- Appointment status
- Update appointments
- Delete appointments

---

## 🧾 Invoice Management

VehicleCare provides invoice management for completed services.

Features include:

- Create invoices
- Customer details
- Vehicle details
- Service details
- Parts cost
- Labour cost
- Tax calculation
- Discount
- Total amount
- View invoices
- Delete invoices
- Print invoices

---

## 📊 Dashboard

The dashboard provides an overview of the vehicle service system.

It displays:

- Total vehicles
- Total customers
- Total services
- Total appointments
- Total revenue
- Upcoming services
- Overdue services
- Service statistics
- Vehicle statistics
- Charts and analytics

---

## 📈 Reports

The application provides reporting functionality for managing service information.

Reports can include:

- Vehicle reports
- Service reports
- Customer information
- Revenue information
- Service history

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure of the web application |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend logic and API communication |
| Chart.js | Charts and data visualization |

---

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express.js | Backend framework and REST API |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| CORS | Cross-origin communication |

---

## Development Tools

- Visual Studio Code
- Git
- GitHub
- MongoDB Compass
- MongoDB Shell
- Live Server
- Node.js / npm

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      VehicleCare     │
                    │       Frontend       │
                    │    HTML/CSS/JS       │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │    Node.js/Express    │
                    └──────────┬───────────┘
                               │
                               │ Mongoose
                               ▼
                    ┌──────────────────────┐
                    │       MongoDB        │
                    │  VehicleServiceDB    │
                    └──────────────────────┘




# ▶️ How to Run the Project

Follow the steps below to run VehicleCare on your local system.

---

## 1️⃣ Install the Required Software

Make sure the following are installed:

- Node.js
- npm
- MongoDB
- MongoDB Shell
- Visual Studio Code
- Git

Check the installations:

```bash
node --version
npm --version
mongosh --version
git --version

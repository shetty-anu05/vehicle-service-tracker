🚗 VehicleCare
Vehicle Service Management System

VehicleCare is a full-stack web application designed to simplify and manage vehicle servicing operations through a centralized dashboard. It provides features for managing vehicles, customers, service records, appointments, invoices, and reports.

✨ Features
🔐 Authentication
User Login and Signup
Custom username registration
JWT-based authentication
Access and refresh tokens
Protected API routes
Admin login
Logout functionality
🚗 Vehicle Management
Add and manage vehicles
Vehicle number, model and type
Owner details
Phone number
Last and next service dates
Service cost
Service status tracking
Vehicle search and filtering
👤 Customer Management
Add customers
Store name, phone, email and address
View customer records
Delete customer records
🔧 Service Management
Record vehicle services
Select vehicle and service type
Technician details
Parts and labour costs
Service description
Next service date
Service history
📅 Appointment Management
Book service appointments
Customer and vehicle details
Service type
Appointment date and time
View, update and delete appointments
🧾 Invoice Management
Create service invoices
Customer and vehicle information
Parts and labour costs
Tax and discount calculation
Total amount calculation
View, delete and print invoices
📊 Dashboard & Reports
Total vehicles
Total services
Total appointments
Total revenue
Overdue services
Upcoming services
Service alerts
Vehicle type distribution
Export vehicle and service data
Printable reports
🎨 User Interface
Modern responsive dashboard
Login and signup interface
Dark/light theme
Responsive design
Toast notifications
Clean navigation
🛠️ Technology Stack
Frontend
HTML5 – Web page structure
CSS3 – Styling and responsive design
JavaScript – Frontend functionality and API communication
Chart.js – Charts and data visualization
Backend
Node.js – JavaScript runtime
Express.js – REST API and server
MongoDB – Database
Mongoose – MongoDB object modeling
JWT – Authentication
CORS – Cross-origin communication
Development Tools
Visual Studio Code
Git
GitHub
MongoDB Compass
Live Server
📁 Project Structure
vehicle-service-tracker/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
└── README.md
⚙️ Requirements

Install the following before running the project:

Node.js
npm
MongoDB
Git
Visual Studio Code

Check Node.js:

node --version
npm --version

Check Git:

git --version

Check MongoDB:

mongod --version
🚀 Installation
1. Clone the Repository
git clone YOUR_GITHUB_REPOSITORY_URL
cd vehicle-service-tracker
2. Install Backend Dependencies
cd backend
npm install
3. Configure MongoDB

VehicleCare uses:

mongodb://127.0.0.1:27017/VehicleServiceDB

Database name:

VehicleServiceDB

MongoDB does not need to be manually populated. The required collections are created when data is stored.

▶️ How to Run
Step 1 — Start MongoDB

Make sure MongoDB is running.

mongod
Step 2 — Start Backend

Open another terminal:

cd backend

Run:

node server.js

The backend runs at:

http://localhost:3000

You can check the server using:

http://localhost:3000/

Health check:

http://localhost:3000/api/health
Step 3 — Start Frontend

Open the frontend folder in Visual Studio Code.

Open:

frontend/index.html

Right-click → Open with Live Server

The frontend normally runs at:

http://127.0.0.1:5500

or:

http://localhost:5500
🔗 Application Architecture
                VehicleCare
                     │
                     ▼
             ┌───────────────┐
             │   Frontend    │
             │ HTML/CSS/JS   │
             └───────┬───────┘
                     │
                REST API
                     │
                     ▼
             ┌───────────────┐
             │    Backend    │
             │ Node + Express│
             └───────┬───────┘
                     │
                  Mongoose
                     │
                     ▼
             ┌───────────────┐
             │    MongoDB    │
             │VehicleServiceDB│
             └───────────────┘
🔑 Default Admin Account
Username: anu
Password: 123456
Name: Anvitha Shetty

The admin account is configured in the backend.

👤 User Signup

New users can create an account by entering:

Full Name
Username
Email
Password

The username is selected by the user and is not automatically generated.

🔐 Authentication

VehicleCare uses JWT authentication.

Protected requests use:

Authorization: Bearer <access_token>

The application uses access and refresh tokens to maintain authenticated sessions.

🔗 API Endpoints
Authentication
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/refresh
GET  /api/auth/me
Dashboard
GET /api/dashboard
Vehicles
GET    /api/vehicles
POST   /api/vehicles
DELETE /api/vehicles/:id
Customers
GET    /api/customers
POST   /api/customers
DELETE /api/customers/:id
Services
GET    /api/services
POST   /api/services
DELETE /api/services/:id
Appointments
GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
Invoices
GET    /api/invoices
POST   /api/invoices
DELETE /api/invoices/:id
Health Check
GET /api/health
🗄️ Database

Database:

VehicleServiceDB

Main collections:

users
vehicles
customers
services
appointments
invoices

MongoDB shell:

use VehicleServiceDB

View collections:

show collections

View vehicles:

db.vehicles.find().pretty()

View customers:

db.customers.find().pretty()

View services:

db.services.find().pretty()

View appointments:

db.appointments.find().pretty()

View invoices:

db.invoices.find().pretty()
🧪 Testing

After starting the backend, open:

http://localhost:3000/

Expected response:

VehicleCare Server is Running

Then open the frontend using Live Server and test:

Login
Signup
Add vehicle
Add customer
Record service
Book appointment
Create invoice
View dashboard
View reports
Export data


Developer
Anvitha Shetty

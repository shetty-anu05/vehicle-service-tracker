const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 3000;

const MONGO_URI =
    "mongodb://127.0.0.1:27017/VehicleServiceDB";

const JWT_SECRET =
    "vehiclecare_jwt_secret_2026";

const ADMIN_USERNAME = "anu";
const ADMIN_PASSWORD = "123456";

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");

    res.setHeader("Expires", "0");

    next();
});


// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected to VehicleServiceDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// =====================================================
// SCHEMAS
// =====================================================


// ---------------- USER ----------------

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);


// ---------------- VEHICLE ----------------

const vehicleSchema = new mongoose.Schema(
    {
        vehicleNumber: {
            type: String,
            required: true
        },

        vehicleName: String,

        ownerName: String,

        type: String,

        model: String,

        year: Number,

        status: {
            type: String,
            default: "Active"
        },

        lastService: String,

        nextService: String
    },
    {
        timestamps: true
    }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);


// ---------------- CUSTOMER ----------------

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        phone: String,

        email: String,

        address: String
    },
    {
        timestamps: true
    }
);

const Customer = mongoose.model("Customer", customerSchema);


// ---------------- SERVICE ----------------

const serviceSchema = new mongoose.Schema(
    {
        serviceName: {
            type: String,
            required: true
        },

        description: String,

        price: Number,

        duration: String
    },
    {
        timestamps: true
    }
);

const Service = mongoose.model("Service", serviceSchema);


// ---------------- APPOINTMENT ----------------

const appointmentSchema = new mongoose.Schema(
    {
        customerName: String,

        vehicleNumber: String,

        service: String,

        date: String,

        time: String,

        status: {
            type: String,
            default: "Pending"
        },

        notes: String
    },
    {
        timestamps: true
    }
);

const Appointment =
    mongoose.model("Appointment", appointmentSchema);


// ---------------- INVOICE ----------------

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: String,

        customerName: String,

        vehicleNumber: String,

        service: String,

        amount: Number,

        date: String,

        status: {
            type: String,
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

const Invoice =
    mongoose.model("Invoice", invoiceSchema);


// =====================================================
// JWT FUNCTIONS
// =====================================================

function createAccessToken(user) {
    return jwt.sign(
        {
            username: user.username,
            name: user.name,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES
        }
    );
}


function createRefreshToken(user) {
    return jwt.sign(
        {
            username: user.username,
            name: user.name,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES
        }
    );
}


// =====================================================
// AUTH MIDDLEWARE
// =====================================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const parts =
        authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    }

    const token = parts[1];

    try {

        const decoded =
            jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}


// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {

    res.send(
        "VehicleCare Server is Running"
    );

});


// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({
        status: "OK",
        message: "VehicleCare API is running"
    });

});


// =====================================================
// AUTH - LOGIN
// =====================================================

app.post("/api/auth/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        if (!username || !password) {

            return res.status(400).json({
                message:
                    "Username and password are required"
            });

        }


        // ---------------- ADMIN LOGIN ----------------

        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            const user = {

                username: ADMIN_USERNAME,

                name: "Anvitha Shetty",

                email: "admin@vehiclecare.com"

            };


            const accessToken =
                createAccessToken(user);

            const refreshToken =
                createRefreshToken(user);


            return res.json({

                message: "Login successful",

                accessToken,

                refreshToken,

                user

            });

        }


        // ---------------- NORMAL USER LOGIN ----------------

        const user =
            await User.findOne({
                username: username
            });


        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid username or password"
            });

        }


        if (user.password !== password) {

            return res.status(401).json({
                message:
                    "Invalid username or password"
            });

        }


        const userData = {

            username: user.username,

            name: user.name,

            email: user.email

        };


        const accessToken =
            createAccessToken(userData);

        const refreshToken =
            createRefreshToken(userData);


        res.json({

            message: "Login successful",

            accessToken,

            refreshToken,

            user: userData

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message: "Server error during login"
        });

    }

});


// =====================================================
// AUTH - SIGNUP
// =====================================================

app.post("/api/auth/signup", async (req, res) => {

    try {

        const {
            name,
            username,
            email,
            password
        } = req.body;


        // ---------------- VALIDATION ----------------

        if (
            !name ||
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "All fields are required."

            });

        }


        // ---------------- USERNAME FORMAT ----------------

        const cleanUsername =
            username.trim();


        if (cleanUsername.length < 3) {

            return res.status(400).json({

                message:
                    "Username must contain at least 3 characters."

            });

        }


        // ---------------- PASSWORD ----------------

        if (password.length < 6) {

            return res.status(400).json({

                message:
                    "Password must contain at least 6 characters."

            });

        }


        // ---------------- ADMIN USERNAME ----------------

        if (
            cleanUsername.toLowerCase() ===
            ADMIN_USERNAME.toLowerCase()
        ) {

            return res.status(400).json({

                message:
                    "This username is reserved."

            });

        }


        // ---------------- CHECK USERNAME ----------------

        const existingUsername =
            await User.findOne({
                username: cleanUsername
            });


        if (existingUsername) {

            return res.status(409).json({

                message:
                    "Username already exists."

            });

        }


        // ---------------- CHECK EMAIL ----------------

        const cleanEmail =
            email.trim().toLowerCase();


        const existingEmail =
            await User.findOne({
                email: cleanEmail
            });


        if (existingEmail) {

            return res.status(409).json({

                message:
                    "Email already registered."

            });

        }


        // ---------------- CREATE USER ----------------

        const user =
            new User({

                name: name.trim(),

                username: cleanUsername,

                email: cleanEmail,

                password: password

            });


        await user.save();


        // ---------------- SUCCESS ----------------

        res.status(201).json({

            message:
                "Account created successfully.",

            user: {

                name: user.name,

                username: user.username,

                email: user.email

            }

        });

    }

    catch (error) {

        console.error(
            "Signup error:",
            error
        );


        // MongoDB duplicate key

        if (error.code === 11000) {

            return res.status(409).json({

                message:
                    "Username or email already exists."

            });

        }


        res.status(500).json({

            message:
                "Server error during signup."

        });

    }

});


// =====================================================
// AUTH - REFRESH TOKEN
// =====================================================

app.post("/api/auth/refresh", (req, res) => {

    try {

        const {
            refreshToken
        } = req.body;


        if (!refreshToken) {

            return res.status(401).json({

                message:
                    "Refresh token required"

            });

        }


        const decoded =
            jwt.verify(
                refreshToken,
                JWT_SECRET
            );


        const user = {

            username: decoded.username,

            name: decoded.name,

            email: decoded.email

        };


        const accessToken =
            createAccessToken(user);


        res.json({

            accessToken

        });

    }

    catch (error) {

        res.status(401).json({

            message:
                "Invalid or expired refresh token"

        });

    }

});


// =====================================================
// AUTH - CURRENT USER
// =====================================================

app.get(
    "/api/auth/me",
    authenticateToken,
    (req, res) => {

        res.json({

            user: {

                username:
                    req.user.username,

                name:
                    req.user.name,

                email:
                    req.user.email

            }

        });

    }
);


// =====================================================
// DASHBOARD
// =====================================================

app.get(
    "/api/dashboard",
    authenticateToken,
    async (req, res) => {

        try {

            const [
                vehicles,
                customers,
                services,
                appointments,
                invoices
            ] = await Promise.all([

                Vehicle.countDocuments(),

                Customer.countDocuments(),

                Service.countDocuments(),

                Appointment.countDocuments(),

                Invoice.countDocuments()

            ]);


            res.json({

                vehicles,

                customers,

                services,

                appointments,

                invoices

            });

        }

        catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load dashboard"

            });

        }

    }
);


// =====================================================
// VEHICLES
// =====================================================

// GET VEHICLES

app.get(
    "/api/vehicles",
    authenticateToken,
    async (req, res) => {

        try {

            const vehicles =
                await Vehicle.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(vehicles);

        }

        catch (error) {

            console.error(
                "Vehicles error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load vehicles"

            });

        }

    }
);


// ADD VEHICLE

app.post(
    "/api/vehicles",
    authenticateToken,
    async (req, res) => {

        try {

            const vehicle =
                new Vehicle(req.body);

            await vehicle.save();

            res.status(201).json(vehicle);

        }

        catch (error) {

            console.error(
                "Add vehicle error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to add vehicle"

            });

        }

    }
);


// DELETE VEHICLE

app.delete(
    "/api/vehicles/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await Vehicle.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "Vehicle deleted successfully"

            });

        }

        catch (error) {

            console.error(
                "Delete vehicle error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to delete vehicle"

            });

        }

    }
);


// =====================================================
// CUSTOMERS
// =====================================================

// GET CUSTOMERS

app.get(
    "/api/customers",
    authenticateToken,
    async (req, res) => {

        try {

            const customers =
                await Customer.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(customers);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to load customers"

            });

        }

    }
);


// ADD CUSTOMER

app.post(
    "/api/customers",
    authenticateToken,
    async (req, res) => {

        try {

            const customer =
                new Customer(req.body);

            await customer.save();

            res.status(201).json(customer);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to add customer"

            });

        }

    }
);


// DELETE CUSTOMER

app.delete(
    "/api/customers/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await Customer.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "Customer deleted successfully"

            });

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to delete customer"

            });

        }

    }
);


// =====================================================
// SERVICES
// =====================================================

// GET SERVICES

app.get(
    "/api/services",
    authenticateToken,
    async (req, res) => {

        try {

            const services =
                await Service.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(services);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to load services"

            });

        }

    }
);


// ADD SERVICE

app.post(
    "/api/services",
    authenticateToken,
    async (req, res) => {

        try {

            const service =
                new Service(req.body);

            await service.save();

            res.status(201).json(service);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to add service"

            });

        }

    }
);


// DELETE SERVICE

app.delete(
    "/api/services/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await Service.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "Service deleted successfully"

            });

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to delete service"

            });

        }

    }
);


// =====================================================
// APPOINTMENTS
// =====================================================

// GET APPOINTMENTS

app.get(
    "/api/appointments",
    authenticateToken,
    async (req, res) => {

        try {

            const appointments =
                await Appointment.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(appointments);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to load appointments"

            });

        }

    }
);


// ADD APPOINTMENT

app.post(
    "/api/appointments",
    authenticateToken,
    async (req, res) => {

        try {

            const appointment =
                new Appointment(req.body);

            await appointment.save();

            res.status(201).json(
                appointment
            );

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to add appointment"

            });

        }

    }
);


// UPDATE APPOINTMENT

app.put(
    "/api/appointments/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const appointment =
                await Appointment.findByIdAndUpdate(

                    req.params.id,

                    req.body,

                    {
                        new: true
                    }

                );


            res.json(appointment);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to update appointment"

            });

        }

    }
);


// DELETE APPOINTMENT

app.delete(
    "/api/appointments/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await Appointment.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "Appointment deleted successfully"

            });

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to delete appointment"

            });

        }

    }
);


// =====================================================
// INVOICES
// =====================================================

// GET INVOICES

app.get(
    "/api/invoices",
    authenticateToken,
    async (req, res) => {

        try {

            const invoices =
                await Invoice.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(invoices);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to load invoices"

            });

        }

    }
);


// ADD INVOICE

app.post(
    "/api/invoices",
    authenticateToken,
    async (req, res) => {

        try {

            const invoice =
                new Invoice(req.body);

            await invoice.save();

            res.status(201).json(invoice);

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to add invoice"

            });

        }

    }
);


// DELETE INVOICE

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await Invoice.findByIdAndDelete(
                req.params.id
            );

            res.json({

                message:
                    "Invoice deleted successfully"

            });

        }

        catch (error) {

            res.status(500).json({

                message:
                    "Failed to delete invoice"

            });

        }

    }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(
        `VehicleCare server running on http://localhost:${PORT}`
    );

});
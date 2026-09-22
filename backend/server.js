require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET =
    process.env.JWT_SECRET;

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME;

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD;


mongoose
    .connect(
        "mongodb://127.0.0.1:27017/VehicleServiceDB"
    )
    .then(() => {

        console.log(
            "MongoDB Connected"
        );

    })
    .catch(error => {

        console.error(
            "MongoDB connection error:",
            error
        );

    });


const vehicleSchema =
    new mongoose.Schema({

        vehicleNumber: String,
        ownerName: String,
        model: String,
        type: String,
        phone: String,
        lastServiceDate: String,
        nextServiceDate: String,
        serviceCost: Number

    });


const customerSchema =
    new mongoose.Schema({

        name: String,
        phone: String,
        email: String,
        address: String

    });


const serviceSchema =
    new mongoose.Schema({

        vehicleId: String,
        vehicleNumber: String,
        serviceDate: String,
        serviceType: String,
        description: String,
        technician: String,
        partsCost: Number,
        labourCost: Number,
        totalCost: Number,
        nextServiceDate: String

    });


const appointmentSchema =
    new mongoose.Schema({

        customerName: String,
        phone: String,
        vehicleNumber: String,
        serviceType: String,
        appointmentDate: String,
        appointmentTime: String,
        status: String

    });


const invoiceSchema =
    new mongoose.Schema({

        invoiceNumber: String,
        customerName: String,
        phone: String,
        vehicleNumber: String,
        model: String,
        serviceType: String,
        serviceDate: String,
        partsCost: Number,
        labourCost: Number,
        tax: Number,
        discount: Number,
        total: Number

    });


const Vehicle =
    mongoose.model(
        "Vehicle",
        vehicleSchema
    );


const Customer =
    mongoose.model(
        "Customer",
        customerSchema
    );


const Service =
    mongoose.model(
        "Service",
        serviceSchema
    );


const Appointment =
    mongoose.model(
        "Appointment",
        appointmentSchema
    );


const Invoice =
    mongoose.model(
        "Invoice",
        invoiceSchema
    );


function generateAccessToken(
    username,
    role
) {

    return jwt.sign(
        {
            username,
            role,
            token_type: "access"
        },

        JWT_SECRET,

        {
            expiresIn: "15m"
        }
    );
}


function generateRefreshToken(
    username,
    role
) {

    return jwt.sign(
        {
            username,
            role,
            token_type: "refresh"
        },

        JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );
}


function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({

            message:
                "Authentication required"

        });

    }


    const parts =
        authHeader.split(" ");


    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({

            message:
                "Invalid authorization format"

        });

    }


    const token =
        parts[1];


    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );


        if (
            decoded.token_type !==
            "access"
        ) {

            return res.status(401).json({

                message:
                    "Invalid access token"

            });

        }


        req.user =
            decoded;


        next();


    } catch {

        return res.status(401).json({

            message:
                "Access token expired or invalid"

        });

    }
}


app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (
                username !==
                ADMIN_USERNAME
            ) {

                return res.status(401).json({

                    message:
                        "Invalid username or password"

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    ADMIN_PASSWORD,
                    10
                );


            const validPassword =
                await bcrypt.compare(
                    password,
                    hashedPassword
                );


            if (!validPassword) {

                return res.status(401).json({

                    message:
                        "Invalid username or password"

                });

            }


            const accessToken =
                generateAccessToken(
                    ADMIN_USERNAME,
                    "admin"
                );


            const refreshToken =
                generateRefreshToken(
                    ADMIN_USERNAME,
                    "admin"
                );


            res.json({

                message:
                    "Login successful",

                accessToken,

                refreshToken,

                username:
                    ADMIN_USERNAME,

                role:
                    "admin"

            });


        } catch {

            res.status(500).json({

                message:
                    "Login failed"

            });

        }

    }
);


app.post(
    "/api/auth/refresh",
    (req, res) => {

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


            if (
                decoded.token_type !==
                "refresh"
            ) {

                return res.status(401).json({

                    message:
                        "Invalid refresh token"

                });

            }


            const accessToken =
                generateAccessToken(
                    decoded.username,
                    decoded.role
                );


            res.json({

                accessToken

            });


        } catch {

            res.status(401).json({

                message:
                    "Refresh token expired or invalid"

            });

        }

    }
);


app.get(
    "/api/auth/me",
    authenticateToken,
    (req, res) => {

        res.json({

            username:
                req.user.username,

            role:
                req.user.role

        });

    }
);


app.get(
    "/api/dashboard",
    authenticateToken,
    async (req, res) => {

        try {

            const totalVehicles =
                await Vehicle.countDocuments();


            const totalServices =
                await Service.countDocuments();


            const totalAppointments =
                await Appointment.countDocuments();


            const invoices =
                await Invoice.find();


            const totalRevenue =
                invoices.reduce(
                    (sum, invoice) =>
                        sum +
                        Number(
                            invoice.total || 0
                        ),
                    0
                );


            const vehicles =
                await Vehicle.find();


            const today =
                new Date();


            let overdue = 0;

            let upcoming = 0;


            vehicles.forEach(
                vehicle => {

                    if (
                        !vehicle.nextServiceDate
                    ) {

                        return;

                    }


                    const serviceDate =
                        new Date(
                            vehicle.nextServiceDate
                        );


                    if (
                        serviceDate <
                        today
                    ) {

                        overdue++;

                    } else {

                        const difference =
                            serviceDate -
                            today;


                        const days =
                            difference /
                            (
                                1000 *
                                60 *
                                60 *
                                24
                            );


                        if (
                            days <= 30
                        ) {

                            upcoming++;

                        }

                    }

                }
            );


            res.json({

                totalVehicles,

                totalServices,

                totalAppointments,

                totalRevenue,

                overdue,

                upcoming

            });


        } catch {

            res.status(500).json({

                message:
                    "Dashboard failed"

            });

        }

    }
);


app.get(
    "/api/vehicles",
    authenticateToken,
    async (req, res) => {

        try {

            const vehicles =
                await Vehicle.find();


            res.json(
                vehicles
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to fetch vehicles"

            });

        }

    }
);


app.post(
    "/api/vehicles",
    authenticateToken,
    async (req, res) => {

        try {

            const vehicle =
                new Vehicle(
                    req.body
                );


            await vehicle.save();


            res.status(201).json(
                vehicle
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to add vehicle"

            });

        }

    }
);


app.put(
    "/api/vehicles/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const vehicle =
                await Vehicle.findByIdAndUpdate(
                    req.params.id,
                    req.body,
                    {
                        new: true
                    }
                );


            res.json(
                vehicle
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to update vehicle"

            });

        }

    }
);


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
                    "Vehicle deleted"

            });


        } catch {

            res.status(500).json({

                message:
                    "Failed to delete vehicle"

            });

        }

    }
);


app.get(
    "/api/services",
    authenticateToken,
    async (req, res) => {

        try {

            const services =
                await Service.find();


            res.json(
                services
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to fetch services"

            });

        }

    }
);


app.post(
    "/api/services",
    authenticateToken,
    async (req, res) => {

        try {

            const service =
                new Service(
                    req.body
                );


            await service.save();


            res.status(201).json(
                service
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to add service"

            });

        }

    }
);


app.get(
    "/api/customers",
    authenticateToken,
    async (req, res) => {

        try {

            const customers =
                await Customer.find();


            res.json(
                customers
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to fetch customers"

            });

        }

    }
);


app.post(
    "/api/customers",
    authenticateToken,
    async (req, res) => {

        try {

            const customer =
                new Customer(
                    req.body
                );


            await customer.save();


            res.status(201).json(
                customer
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to add customer"

            });

        }

    }
);


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
                    "Customer deleted"

            });


        } catch {

            res.status(500).json({

                message:
                    "Failed to delete customer"

            });

        }

    }
);


app.get(
    "/api/appointments",
    authenticateToken,
    async (req, res) => {

        try {

            const appointments =
                await Appointment.find();


            res.json(
                appointments
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to fetch appointments"

            });

        }

    }
);


app.post(
    "/api/appointments",
    authenticateToken,
    async (req, res) => {

        try {

            const appointment =
                new Appointment(
                    req.body
                );


            await appointment.save();


            res.status(201).json(
                appointment
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to add appointment"

            });

        }

    }
);


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


            res.json(
                appointment
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to update appointment"

            });

        }

    }
);


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
                    "Appointment deleted"

            });


        } catch {

            res.status(500).json({

                message:
                    "Failed to delete appointment"

            });

        }

    }
);


app.get(
    "/api/invoices",
    authenticateToken,
    async (req, res) => {

        try {

            const invoices =
                await Invoice.find();


            res.json(
                invoices
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to fetch invoices"

            });

        }

    }
);


app.post(
    "/api/invoices",
    authenticateToken,
    async (req, res) => {

        try {

            const invoice =
                new Invoice(
                    req.body
                );


            await invoice.save();


            res.status(201).json(
                invoice
            );


        } catch {

            res.status(500).json({

                message:
                    "Failed to create invoice"

            });

        }

    }
);


app.use(
    express.static(
        path.join(
            __dirname,
            "..",
            "frontend"
        )
    )
);


app.get(
    "/{*splat}",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "..",
                "frontend",
                "index.html"
            )
        );

    }
);


app.listen(
    3000,
    () => {

        console.log(
            "Server running at http://localhost:3000"
        );

    }
);
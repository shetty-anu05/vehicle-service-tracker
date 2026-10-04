const API = "http://localhost:3000/api";

let accessToken =
    localStorage.getItem("vehiclecare-access-token");

let refreshToken =
    localStorage.getItem("vehiclecare-refresh-token");

let vehicles = [];
let services = [];
let customers = [];
let appointments = [];
let invoices = [];
let vehicleChart = null;


/* =====================================================
   AUTHENTICATION
===================================================== */

async function refreshAccessToken() {

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(
            `${API}/auth/refresh`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refreshToken
                })
            }
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        accessToken = data.accessToken;

        localStorage.setItem(
            "vehiclecare-access-token",
            accessToken
        );

        return true;

    } catch (error) {

        console.error(
            "Refresh token error:",
            error
        );

        return false;
    }
}


async function apiFetch(
    url,
    options = {},
    retry = true
) {

    const headers = {
        ...(options.headers || {})
    };

    if (accessToken) {

        headers.Authorization =
            `Bearer ${accessToken}`;
    }

    const response = await fetch(
        url,
        {
            ...options,
            headers
        }
    );

    if (
        response.status === 401 &&
        retry
    ) {

        const refreshed =
            await refreshAccessToken();

        if (refreshed) {

            return apiFetch(
                url,
                options,
                false
            );
        }

        logout(false);

        throw new Error(
            "Authentication required"
        );
    }

    return response;
}


/* =====================================================
   LOGIN
===================================================== */

async function login(event) {

    event.preventDefault();

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const message =
        document.getElementById(
            "authMessage"
        );

    message.classList.remove(
        "show",
        "info"
    );

    if (!username || !password) {

        message.textContent =
            "Please enter username and password.";

        message.classList.add("show");

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            message.textContent =
                data.message ||
                "Invalid username or password";

            message.classList.add("show");

            return;
        }

        accessToken =
            data.accessToken;

        refreshToken =
            data.refreshToken;

        localStorage.setItem(
            "vehiclecare-access-token",
            accessToken
        );

        localStorage.setItem(
            "vehiclecare-refresh-token",
            refreshToken
        );

        localStorage.removeItem(
            "vehiclecare-token"
        );

        document
            .getElementById("authScreen")
            .classList.add("hidden");

        document
            .getElementById("loginPassword")
            .value = "";

        message.classList.remove("show");

        showPage("dashboard");

        await loadVehicles();
        await loadCustomers();
        await loadServices();
        await loadAppointments();
        await loadInvoices();

        showToast(
            "Login successful"
        );

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        message.textContent =
            "Unable to connect to server";

        message.classList.add("show");
    }
}


/* =====================================================
   SIGNUP
===================================================== */

async function handleSignup(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("signupName")
            ?.value
            .trim();

    const username =
        document
            .getElementById("signupUsername")
            ?.value
            .trim();

    const email =
        document
            .getElementById("signupEmail")
            ?.value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            ?.value;


    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (
        !name ||
        !username ||
        !email ||
        !password
    ) {

        showAuthInfo(
            "Please fill in all fields."
        );

        return;
    }


    if (username.length < 3) {

        showAuthInfo(
            "Username must be at least 3 characters."
        );

        return;
    }


    if (password.length < 6) {

        showAuthInfo(
            "Password must be at least 6 characters."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API}/auth/signup`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name,

                        username,

                        email,

                        password

                    })
                }
            );


        const data =
            await response.json();


        /* ---------------------------------------------
           SIGNUP FAILED
        --------------------------------------------- */

        if (!response.ok) {

            showAuthInfo(
                data.message ||
                "Signup failed."
            );

            return;
        }


        /* ---------------------------------------------
           ACCOUNT CREATED
        --------------------------------------------- */

        switchAuth("login");


        /*
         * Put the username entered by the user
         * into the login username field.
         */

        const loginUsername =
            document.getElementById(
                "loginUsername"
            );

        if (loginUsername) {

            loginUsername.value =
                username;
        }


        showAuthInfo(
            `Account created successfully! You can now login with "${username}".`
        );


        /* ---------------------------------------------
           CLEAR SIGNUP FIELDS
        --------------------------------------------- */

        const signupName =
            document.getElementById(
                "signupName"
            );

        const signupUsername =
            document.getElementById(
                "signupUsername"
            );

        const signupEmail =
            document.getElementById(
                "signupEmail"
            );

        const signupPassword =
            document.getElementById(
                "signupPassword"
            );


        if (signupName) {

            signupName.value = "";
        }


        if (signupUsername) {

            signupUsername.value = "";
        }


        if (signupEmail) {

            signupEmail.value = "";
        }


        if (signupPassword) {

            signupPassword.value = "";
        }


    } catch (error) {

        console.error(
            "Signup error:",
            error
        );

        showAuthInfo(
            "Unable to connect to server."
        );
    }
}


/* =====================================================
   LOGOUT
===================================================== */

function logout(
    showMessage = true
) {

    accessToken = null;
    refreshToken = null;

    localStorage.removeItem(
        "vehiclecare-access-token"
    );

    localStorage.removeItem(
        "vehiclecare-refresh-token"
    );

    localStorage.removeItem(
        "vehiclecare-token"
    );

    const authScreen =
        document.getElementById(
            "authScreen"
        );

    if (authScreen) {

        authScreen.classList.remove(
            "hidden"
        );
    }

    const username =
        document.getElementById(
            "loginUsername"
        );

    const password =
        document.getElementById(
            "loginPassword"
        );

    if (username) {
        username.value = "";
    }

    if (password) {
        password.value = "";
    }

    if (showMessage) {

        showToast(
            "Logged out successfully"
        );
    }
}


/* =====================================================
   CHECK AUTHENTICATION
===================================================== */

function checkAuthentication() {

    const authScreen =
        document.getElementById(
            "authScreen"
        );

    if (
        !accessToken &&
        !refreshToken
    ) {

        if (authScreen) {

            authScreen.classList.remove(
                "hidden"
            );
        }

        return false;
    }

    if (authScreen) {

        authScreen.classList.add(
            "hidden"
        );
    }

    return true;
}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active"
            );
        });

    const selectedPage =
        document.getElementById(page);

    if (!selectedPage) {
        return;
    }

    selectedPage.classList.add(
        "active"
    );

    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "vehicles") {
        loadVehicles();
    }

    if (page === "customers") {
        loadCustomers();
    }

    if (page === "services") {
        loadServices();
    }

    if (page === "appointments") {
        loadAppointments();
    }

    if (page === "invoices") {
        loadInvoices();
    }

    if (page === "reports") {
        loadReports();
    }
}


/* =====================================================
   LOGIN / SIGNUP UI
===================================================== */

function switchAuth(mode) {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const loginTab =
        document.getElementById(
            "loginTab"
        );

    const signupTab =
        document.getElementById(
            "signupTab"
        );

    const title =
        document.getElementById(
            "authTitle"
        );

    const eyebrow =
        document.getElementById(
            "authEyebrow"
        );

    const subtitle =
        document.getElementById(
            "authSubtitle"
        );

    const message =
        document.getElementById(
            "authMessage"
        );

    const isLogin =
        mode === "login";

    if (loginForm) {

        loginForm.classList.toggle(
            "hidden-auth-form",
            !isLogin
        );
    }

    if (signupForm) {

        signupForm.classList.toggle(
            "hidden-auth-form",
            isLogin
        );
    }

    if (loginTab) {

        loginTab.classList.toggle(
            "active",
            isLogin
        );
    }

    if (signupTab) {

        signupTab.classList.toggle(
            "active",
            !isLogin
        );
    }

    if (message) {

        message.classList.remove(
            "show",
            "info"
        );
    }

    if (isLogin) {

        if (eyebrow) {

            eyebrow.textContent =
                "WELCOME BACK";
        }

        if (title) {

            title.textContent =
                "Sign in to VehicleCare";
        }

        if (subtitle) {

            subtitle.textContent =
                "Enter your details to continue to your dashboard.";
        }

    } else {

        if (eyebrow) {

            eyebrow.textContent =
                "GET STARTED";
        }

        if (title) {

            title.textContent =
                "Create your account";
        }

        if (subtitle) {

            subtitle.textContent =
                "Set up your workspace and start managing vehicles smarter.";
        }
    }
}


function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );

    if (!input) {
        return;
    }

    if (
        input.type === "password"
    ) {

        input.type = "text";

        button.textContent =
            "Hide";

    } else {

        input.type = "password";

        button.textContent =
            "Show";
    }
}


function showAuthInfo(text) {

    const message =
        document.getElementById(
            "authMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.classList.add(
        "show",
        "info"
    );
}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        const response =
            await apiFetch(
                `${API}/dashboard`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const dashVehicles =
            document.getElementById(
                "dashVehicles"
            );

        const dashServices =
            document.getElementById(
                "dashServices"
            );

        const dashAppointments =
            document.getElementById(
                "dashAppointments"
            );

        const dashRevenue =
            document.getElementById(
                "dashRevenue"
            );

        const dashOverdue =
            document.getElementById(
                "dashOverdue"
            );

        const dashUpcoming =
            document.getElementById(
                "dashUpcoming"
            );

        if (dashVehicles) {

            dashVehicles.textContent =
                data.vehicles ??
                data.totalVehicles ??
                0;
        }

        if (dashServices) {

            dashServices.textContent =
                data.services ??
                data.totalServices ??
                0;
        }

        if (dashAppointments) {

            dashAppointments.textContent =
                data.appointments ??
                data.totalAppointments ??
                0;
        }

        if (dashRevenue) {

            dashRevenue.textContent =
                `₹${Number(
                    data.revenue ??
                    data.totalRevenue ??
                    0
                ).toLocaleString("en-IN")}`;
        }

        if (dashOverdue) {

            dashOverdue.textContent =
                data.overdue ??
                0;
        }

        if (dashUpcoming) {

            dashUpcoming.textContent =
                data.upcoming ??
                0;
        }

        await loadServiceAlerts();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Dashboard failed",
                true
            );
        }
    }
}


async function loadServiceAlerts() {

    const container =
        document.getElementById(
            "serviceAlerts"
        );

    if (!container) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/vehicles`
            );

        if (!response.ok) {
            throw new Error();
        }

        const data =
            await response.json();

        const today =
            new Date();

        const overdue =
            data.filter(
                vehicle => {

                    if (
                        !vehicle.nextServiceDate
                    ) {
                        return false;
                    }

                    return (
                        new Date(
                            vehicle.nextServiceDate
                        ) < today
                    );
                }
            );

        if (
            overdue.length === 0
        ) {

            container.innerHTML = `
                <div class="alert">
                    ✅ No vehicles currently require attention.
                </div>
            `;

            return;
        }

        container.innerHTML =
            overdue
                .map(
                    vehicle => `

                    <div class="alert">

                        <strong>
                            ${
                                vehicle.vehicleNumber ||
                                "-"
                            }
                        </strong>

                        <span>
                            ${
                                vehicle.ownerName ||
                                "-"
                            }
                            - Service overdue
                        </span>

                    </div>

                `
                )
                .join("");

    } catch (error) {

        console.error(
            "Service alerts error:",
            error
        );

        container.innerHTML = `
            <div class="alert">
                Unable to load service alerts.
            </div>
        `;
    }
}


/* =====================================================
   VEHICLES
===================================================== */

async function loadVehicles() {

    try {

        const response =
            await apiFetch(
                `${API}/vehicles`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        vehicles =
            await response.json();

        displayVehicles(
            vehicles
        );

        if (
            typeof populateVehicleSelects ===
            "function"
        ) {

            populateVehicleSelects();
        }

    } catch (error) {

        console.error(
            "loadVehicles error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load vehicles",
                true
            );
        }
    }
}


function displayVehicles(data) {

    const tbody =
        document.getElementById(
            "vehicleList"
        );

    if (!tbody) {
        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    No vehicles found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        data
            .map(
                vehicle => {

                    let status =
                        "Active";

                    if (
                        vehicle.nextServiceDate &&
                        new Date(
                            vehicle.nextServiceDate
                        ) < new Date()
                    ) {

                        status =
                            "Overdue";
                    }

                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${
                                        vehicle.vehicleNumber ||
                                        "-"
                                    }
                                </strong>
                            </td>

                            <td>
                                ${
                                    vehicle.ownerName ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    vehicle.model ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    vehicle.type ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    vehicle.phone ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    vehicle.nextServiceDate ||
                                    "-"
                                }
                            </td>

                            <td>

                                <span class="status-badge">
                                    ${status}
                                </span>

                            </td>

                            <td>

                                <div class="table-actions">

                                    <button
                                        class="small-btn"
                                        onclick="viewVehicle('${vehicle._id}')"
                                    >
                                        View
                                    </button>

                                    <button
                                        class="small-btn"
                                        onclick="editVehicle('${vehicle._id}')"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="small-btn danger"
                                        onclick="deleteVehicle('${vehicle._id}')"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
}


/* =====================================================
   VEHICLE DROPDOWNS
===================================================== */

function populateVehicleSelects() {

    const serviceVehicle =
        document.getElementById(
            "serviceVehicle"
        );

    if (!serviceVehicle) {
        return;
    }

    const currentValue =
        serviceVehicle.value;

    serviceVehicle.innerHTML = `
        <option value="">
            Select Vehicle
        </option>
    `;

    vehicles.forEach(
        vehicle => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                vehicle._id;

            option.textContent =
                `${vehicle.vehicleNumber || "-"} - ${
                    vehicle.ownerName || "-"
                }`;

            serviceVehicle.appendChild(
                option
            );
        }
    );

    if (
        vehicles.some(
            vehicle =>
                vehicle._id === currentValue
        )
    ) {

        serviceVehicle.value =
            currentValue;
    }
}


/* =====================================================
   VEHICLE VIEW
===================================================== */

function viewVehicle(id) {

    const vehicle =
        vehicles.find(
            item =>
                item._id === id
        );

    if (!vehicle) {
        return;
    }

    alert(
        `VEHICLE DETAILS\n\n` +

        `Vehicle Number: ${
            vehicle.vehicleNumber || "-"
        }\n` +

        `Owner: ${
            vehicle.ownerName || "-"
        }\n` +

        `Model: ${
            vehicle.model || "-"
        }\n` +

        `Type: ${
            vehicle.type || "-"
        }\n` +

        `Phone: ${
            vehicle.phone || "-"
        }\n` +

        `Last Service: ${
            vehicle.lastServiceDate || "-"
        }\n` +

        `Next Service: ${
            vehicle.nextServiceDate || "-"
        }\n` +

        `Service Cost: ₹${
            Number(
                vehicle.serviceCost || 0
            ).toLocaleString("en-IN")
        }`
    );
}


function searchVehicles() {

    filterVehicles();
}


function filterVehicles() {

    const searchElement =
        document.getElementById(
            "vehicleSearch"
        );

    const filterElement =
        document.getElementById(
            "vehicleFilter"
        );

    if (
        !searchElement ||
        !filterElement
    ) {

        displayVehicles(
            vehicles
        );

        return;
    }

    const search =
        searchElement.value
            .toLowerCase()
            .trim();

    const type =
        filterElement.value;

    const filtered =
        vehicles.filter(
            vehicle => {

                const text = `
                    ${vehicle.vehicleNumber || ""}
                    ${vehicle.ownerName || ""}
                    ${vehicle.model || ""}
                    ${vehicle.phone || ""}
                `.toLowerCase();

                const matchesSearch =
                    !search ||
                    text.includes(search);

                const matchesType =
                    !type ||
                    vehicle.type === type;

                return (
                    matchesSearch &&
                    matchesType
                );
            }
        );

    displayVehicles(
        filtered
    );
}


function showVehicleForm() {

    const form =
        document.getElementById(
            "vehicleForm"
        );

    if (form) {

        form.classList.remove(
            "hidden"
        );
    }
}


function hideVehicleForm() {

    const form =
        document.getElementById(
            "vehicleForm"
        );

    if (form) {

        form.classList.add(
            "hidden"
        );
    }
}


/* =====================================================
   ADD VEHICLE
===================================================== */

async function addVehicle() {

    const getValue =
        id => {

            const element =
                document.getElementById(
                    id
                );

            return element
                ? element.value.trim()
                : "";
        };

    const data = {

        vehicleNumber:
            getValue("vehicleNumber"),

        ownerName:
            getValue("ownerName"),

        model:
            getValue("vehicleModel"),

        type:
            document.getElementById(
                "vehicleType"
            )?.value || "",

        phone:
            getValue("vehiclePhone"),

        lastServiceDate:
            document.getElementById(
                "lastServiceDate"
            )?.value || "",

        nextServiceDate:
            document.getElementById(
                "nextServiceDate"
            )?.value || "",

        serviceCost:
            Number(
                document.getElementById(
                    "serviceCost"
                )?.value || 0
            )
    };

    if (
        !data.vehicleNumber ||
        !data.ownerName
    ) {

        showToast(
            "Vehicle number and owner name are required",
            true
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/vehicles`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to add vehicle"
            );
        }

        showToast(
            "Vehicle added successfully"
        );

        clearVehicleForm();

        await loadVehicles();

        showPage(
            "vehicles"
        );

    } catch (error) {

        console.error(
            "Add vehicle error:",
            error
        );

        showToast(
            error.message ||
            "Failed to add vehicle",
            true
        );
    }
}


function clearVehicleForm() {

    const ids = [

        "vehicleNumber",
        "ownerName",
        "vehicleModel",
        "vehicleType",
        "vehiclePhone",
        "lastServiceDate",
        "nextServiceDate",
        "serviceCost"

    ];

    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.value = "";
            }
        }
    );
}


/* =====================================================
   SERVICES
===================================================== */

async function loadServices() {

    try {

        const response =
            await apiFetch(
                `${API}/services`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        services =
            await response.json();

        displayServices(
            services
        );

        populateVehicleSelects();

    } catch (error) {

        console.error(
            "Failed to load services:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load services",
                true
            );
        }
    }
}



function displayServices(data) {
    const container = document.getElementById("serviceList");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No services found.
                </td>
            </tr>
        `;
        return;
    }

    const formatCost = (value) =>
        `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

    container.innerHTML = data.map(service => {
        const parts = Number(service.partsCost ?? 0);
        const labour = Number(service.labourCost ?? 0);
        const total = Number(
            service.totalCost ?? service.cost ?? (parts + labour)
        );

        return `
            <tr>
                <td>${service.serviceDate || "-"}</td>
                <td>${service.vehicleNumber || "-"}</td>
                <td>
                    <strong>${service.serviceType || "-"}</strong>
                    <br>
                    <small>${service.description || ""}</small>
                </td>
                <td>${service.technician || "-"}</td>
                <td>${formatCost(parts)}</td>
                <td>${formatCost(labour)}</td>
                <td><strong>${formatCost(total)}</strong></td>
            </tr>
        `;
    }).join("");
}


/* =====================================================
   ADD SERVICE
===================================================== */





async function addService() {
    const getValue = (id) =>
        document.getElementById(id)?.value?.trim() || "";

    const vehicleId = getValue("serviceVehicle");

    const data = {
        vehicleId: vehicleId,
        serviceDate: getValue("serviceDate"),
        serviceType: getValue("serviceType"),
        description: getValue("serviceDescription"),
        technician: getValue("serviceTechnician"),
        partsCost: Number(getValue("partsCost") || 0),
        labourCost: Number(getValue("labourCost") || 0)
    };

    data.totalCost = data.partsCost + data.labourCost;

    if (!data.vehicleId) {
        showToast("Please select a vehicle.", true);
        return;
    }

    if (!data.serviceDate || !data.serviceType) {
        showToast("Please enter the service date and type.", true);
        return;
    }

    if (
        !Number.isFinite(data.partsCost) ||
        !Number.isFinite(data.labourCost) ||
        data.partsCost < 0 ||
        data.labourCost < 0
    ) {
        showToast("Please enter valid service costs.", true);
        return;
    }

    try {
        const response = await apiFetch(`${API}/services`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Failed to save service."
            );
        }

        await loadServices();
        await loadDashboard();

        showToast("Service saved successfully!");

    } catch (error) {
        console.error("Add service error:", error);
        showToast(error.message || "Failed to save service.", true);
    }
}


/* =====================================================
   CUSTOMERS
===================================================== */

async function loadCustomers() {

    try {

        const response =
            await apiFetch(
                `${API}/customers`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        customers =
            await response.json();

        displayCustomers(
            customers
        );

    } catch (error) {

        console.error(
            "Load customers error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load customers",
                true
            );
        }
    }
}


function displayCustomers(data) {

    const container =
        document.getElementById(
            "customerList"
        );

    if (!container) {
        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="panel">
                No customers registered yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data
            .map(
                customer => `

                <div class="customer-card">

                    <div class="customer-avatar">

                        ${String(
                            customer.name ||
                            "C"
                        )
                            .charAt(0)
                            .toUpperCase()}

                    </div>

                    <div class="customer-info">

                        <h3>
                            ${
                                customer.name ||
                                "-"
                            }
                        </h3>

                        <p>
                            📞 ${
                                customer.phone ||
                                "-"
                            }
                        </p>

                        <p>
                            ✉️ ${
                                customer.email ||
                                "-"
                            }
                        </p>

                        <p>
                            📍 ${
                                customer.address ||
                                "-"
                            }
                        </p>

                    </div>

                    <button
                        class="small-btn danger"
                        onclick="deleteCustomer('${customer._id}')"
                    >
                        Delete
                    </button>

                </div>

            `
            )
            .join("");
}


async function addCustomer() {

    const data = {

        name:
            document
                .getElementById(
                    "customerName"
                )
                .value
                .trim(),

        phone:
            document
                .getElementById(
                    "customerPhone"
                )
                .value
                .trim(),

        email:
            document
                .getElementById(
                    "customerEmail"
                )
                .value
                .trim(),

        address:
            document
                .getElementById(
                    "customerAddress"
                )
                .value
                .trim()
    };

    if (
        !data.name ||
        !data.phone
    ) {

        showToast(
            "Enter customer name and phone",
            true
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/customers`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to add customer"
            );
        }

        [
            "customerName",
            "customerPhone",
            "customerEmail",
            "customerAddress"
        ].forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.value = "";
                }
            }
        );

        await loadCustomers();

        showToast(
            "Customer added successfully"
        );

    } catch (error) {

        console.error(
            "Add customer error:",
            error
        );

        showToast(
            error.message ||
            "Failed to add customer",
            true
        );
    }
}


async function deleteCustomer(id) {

    if (
        !confirm(
            "Delete this customer?"
        )
    ) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/customers/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        await loadCustomers();

        showToast(
            "Customer deleted successfully"
        );

    } catch (error) {

        console.error(
            "Delete customer error:",
            error
        );

        showToast(
            "Failed to delete customer",
            true
        );
    }
}


/* =====================================================
   APPOINTMENTS
===================================================== */

async function loadAppointments() {

    try {

        const response =
            await apiFetch(
                `${API}/appointments`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        appointments =
            await response.json();

        displayAppointments(
            appointments
        );

    } catch (error) {

        console.error(
            "Load appointments error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load appointments",
                true
            );
        }
    }
}


function displayAppointments(data) {

    const container =
        document.getElementById(
            "appointmentList"
        );

    if (!container) {
        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="panel">
                No appointments scheduled.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data
            .map(
                appointment => `

                <div class="appointment-card">

                    <div class="appointment-header">

                        <h3>
                            ${
                                appointment.customerName ||
                                "-"
                            }
                        </h3>

                        <span class="status-badge">
                            ${
                                appointment.status ||
                                "Pending"
                            }
                        </span>

                    </div>

                    <p>
                        📞 ${
                            appointment.phone ||
                            "-"
                        }
                    </p>

                    <p>
                        🚗 ${
                            appointment.vehicleNumber ||
                            "-"
                        }
                    </p>

                    <p>
                        🔧 ${
                            appointment.serviceType ||
                            "-"
                        }
                    </p>

                    <p>
                        📅 ${
                            appointment.appointmentDate ||
                            "-"
                        }
                    </p>

                    <p>
                        🕒 ${
                            appointment.appointmentTime ||
                            "-"
                        }
                    </p>

                    <div class="card-actions">

                        <button
                            class="small-btn"
                            onclick="completeAppointment('${appointment._id}')"
                        >
                            Complete
                        </button>

                        <button
                            class="small-btn danger"
                            onclick="deleteAppointment('${appointment._id}')"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `
            )
            .join("");
}


async function addAppointment() {

    const data = {

        customerName:
            document
                .getElementById(
                    "appointmentCustomer"
                )
                .value
                .trim(),

        phone:
            document
                .getElementById(
                    "appointmentPhone"
                )
                .value
                .trim(),

        vehicleNumber:
            document
                .getElementById(
                    "appointmentVehicle"
                )
                .value
                .trim(),

        serviceType:
            document.getElementById(
                "appointmentService"
            ).value,

        appointmentDate:
            document.getElementById(
                "appointmentDate"
            ).value,

        appointmentTime:
            document.getElementById(
                "appointmentTime"
            ).value,

        status:
            "Pending"
    };

    try {

        const response =
            await apiFetch(
                `${API}/appointments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to add appointment"
            );
        }

        [
            "appointmentCustomer",
            "appointmentPhone",
            "appointmentVehicle",
            "appointmentDate",
            "appointmentTime"
        ].forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.value = "";
                }
            }
        );

        const appointmentService =
            document.getElementById(
                "appointmentService"
            );

        if (appointmentService) {
            appointmentService.value = "";
        }

        await loadAppointments();
        await loadDashboard();

        showToast(
            "Appointment booked successfully"
        );

    } catch (error) {

        console.error(
            "Add appointment error:",
            error
        );

        showToast(
            error.message ||
            "Failed to add appointment",
            true
        );
    }
}


async function completeAppointment(id) {

    try {

        const response =
            await apiFetch(
                `${API}/appointments/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status:
                            "Completed"
                    })
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        await loadAppointments();

        showToast(
            "Appointment completed"
        );

    } catch (error) {

        console.error(
            "Complete appointment error:",
            error
        );

        showToast(
            "Failed to update appointment",
            true
        );
    }
}


async function deleteAppointment(id) {

    if (
        !confirm(
            "Delete this appointment?"
        )
    ) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/appointments/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        await loadAppointments();
        await loadDashboard();

        showToast(
            "Appointment deleted successfully"
        );

    } catch (error) {

        console.error(
            "Delete appointment error:",
            error
        );

        showToast(
            "Failed to delete appointment",
            true
        );
    }
}


/* =====================================================
   INVOICES
===================================================== */

async function loadInvoices() {

    try {

        const response =
            await apiFetch(
                `${API}/invoices`
            );

        if (!response.ok) {

            const errorData =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );
        }

        invoices =
            await response.json();

        displayInvoices(
            invoices
        );

    } catch (error) {

        console.error(
            "Load invoices error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load invoices",
                true
            );
        }
    }
}


function displayInvoices(data) {

    const tbody =
        document.getElementById(
            "invoiceList"
        );

    if (!tbody) {
        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No invoices found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        data
            .map(
                invoice => `

                <tr>

                    <td>
                        ${
                            invoice.invoiceNumber ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            invoice.customerName ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            invoice.vehicleNumber ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            invoice.serviceType ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            invoice.serviceDate ||
                            "-"
                        }
                    </td>

                    <td>

                        <strong>
                            ₹${Number(
                                invoice.total ||
                                0
                            ).toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </td>

                    <td>

                        <button
                            class="small-btn"
                            onclick="printInvoice('${invoice._id}')"
                        >
                            Print
                        </button>

                    </td>

                </tr>

            `
            )
            .join("");
}


async function createInvoice() {

    const partsCost =
        Number(
            document.getElementById(
                "invoiceParts"
            ).value || 0
        );

    const labourCost =
        Number(
            document.getElementById(
                "invoiceLabour"
            ).value || 0
        );

    const tax =
        Number(
            document.getElementById(
                "invoiceTax"
            ).value || 0
        );

    const discount =
        Number(
            document.getElementById(
                "invoiceDiscount"
            ).value || 0
        );

    const subtotal =
        partsCost +
        labourCost;

    const taxAmount =
        subtotal *
        tax /
        100;

    const total =
        subtotal +
        taxAmount -
        discount;

    const data = {

        invoiceNumber:
            `INV-${Date.now()}`,

        customerName:
            document
                .getElementById(
                    "invoiceCustomer"
                )
                .value
                .trim(),

        phone:
            document
                .getElementById(
                    "invoicePhone"
                )
                .value
                .trim(),

        vehicleNumber:
            document
                .getElementById(
                    "invoiceVehicle"
                )
                .value
                .trim(),

        model:
            document
                .getElementById(
                    "invoiceModel"
                )
                .value
                .trim(),

        serviceType:
            document
                .getElementById(
                    "invoiceService"
                )
                .value
                .trim(),

        serviceDate:
            document.getElementById(
                "invoiceDate"
            ).value,

        partsCost,

        labourCost,

        tax:
            taxAmount,

        discount,

        total
    };

    try {

        const response =
            await apiFetch(
                `${API}/invoices`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to create invoice"
            );
        }

        [
            "invoiceCustomer",
            "invoicePhone",
            "invoiceVehicle",
            "invoiceModel",
            "invoiceService",
            "invoiceDate",
            "invoiceParts",
            "invoiceLabour",
            "invoiceTax",
            "invoiceDiscount"
        ].forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.value = "";
                }
            }
        );

        await loadInvoices();
        await loadDashboard();

        showToast(
            "Invoice created successfully"
        );

    } catch (error) {

        console.error(
            "Create invoice error:",
            error
        );

        showToast(
            error.message ||
            "Failed to create invoice",
            true
        );
    }
}


/* =====================================================
   PRINT INVOICE
===================================================== */

function printInvoice(id) {

    const invoice =
        invoices.find(
            item =>
                item._id === id
        );

    if (!invoice) {
        return;
    }

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=800,height=900"
        );

    if (!printWindow) {

        showToast(
            "Please allow pop-ups to print invoice.",
            true
        );

        return;
    }

    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${invoice.invoiceNumber || "Invoice"}
            </title>

            <style>

                body {
                    font-family:
                        Arial,
                        sans-serif;

                    padding:
                        40px;

                    color:
                        #111827;
                }

                h1 {
                    margin-bottom:
                        5px;
                }

                .line {
                    border-bottom:
                        1px solid #ddd;

                    margin:
                        20px 0;
                }

                .row {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    padding:
                        8px 0;
                }

                .total {
                    font-size:
                        20px;

                    font-weight:
                        bold;
                }

            </style>

        </head>

        <body>

            <h1>
                VehicleCare
            </h1>

            <p>
                Vehicle Service Invoice
            </p>

            <div class="line"></div>

            <div class="row">
                <strong>Invoice:</strong>
                <span>
                    ${
                        invoice.invoiceNumber ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Customer:</strong>
                <span>
                    ${
                        invoice.customerName ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Phone:</strong>
                <span>
                    ${
                        invoice.phone ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Vehicle:</strong>
                <span>
                    ${
                        invoice.vehicleNumber ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Model:</strong>
                <span>
                    ${
                        invoice.model ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Service:</strong>
                <span>
                    ${
                        invoice.serviceType ||
                        "-"
                    }
                </span>
            </div>

            <div class="row">
                <strong>Date:</strong>
                <span>
                    ${
                        invoice.serviceDate ||
                        "-"
                    }
                </span>
            </div>

            <div class="line"></div>

            <div class="row">
                <span>Parts Cost</span>
                <span>
                    ₹${Number(
                        invoice.partsCost || 0
                    ).toLocaleString("en-IN")}
                </span>
            </div>

            <div class="row">
                <span>Labour Cost</span>
                <span>
                    ₹${Number(
                        invoice.labourCost || 0
                    ).toLocaleString("en-IN")}
                </span>
            </div>

            <div class="row">
                <span>Tax</span>
                <span>
                    ₹${Number(
                        invoice.tax || 0
                    ).toLocaleString("en-IN")}
                </span>
            </div>

            <div class="row">
                <span>Discount</span>
                <span>
                    ₹${Number(
                        invoice.discount || 0
                    ).toLocaleString("en-IN")}
                </span>
            </div>

            <div class="line"></div>

            <div class="row total">
                <span>Total</span>
                <span>
                    ₹${Number(
                        invoice.total || 0
                    ).toLocaleString("en-IN")}
                </span>
            </div>

            <script>

                window.onload = function() {
                    window.print();
                };

            <\/script>

        </body>

        </html>

    `);

    printWindow.document.close();
}


/* =====================================================
   REPORTS
===================================================== */

async function loadReports() {

    try {

        const response =
            await apiFetch(
                `${API}/dashboard`
            );

        if (!response.ok) {
            throw new Error();
        }

        const dashboard =
            await response.json();

        const reportVehicles =
            document.getElementById(
                "reportVehicles"
            );

        const reportServices =
            document.getElementById(
                "reportServices"
            );

        const reportRevenue =
            document.getElementById(
                "reportRevenue"
            );

        if (reportVehicles) {

            reportVehicles.textContent =
                dashboard.totalVehicles ??
                dashboard.vehicles ??
                0;
        }

        if (reportServices) {

            reportServices.textContent =
                dashboard.totalServices ??
                dashboard.services ??
                0;
        }

        if (reportRevenue) {

            reportRevenue.textContent =
                `₹${Number(
                    dashboard.totalRevenue ??
                    dashboard.revenue ??
                    0
                ).toLocaleString("en-IN")}`;
        }

        const vehiclesResponse =
            await apiFetch(
                `${API}/vehicles`
            );

        if (!vehiclesResponse.ok) {
            throw new Error();
        }

        const data =
            await vehiclesResponse.json();

        const counts = {};

        data.forEach(
            vehicle => {

                const type =
                    vehicle.type ||
                    "Other";

                counts[type] =
                    (counts[type] || 0) +
                    1;
            }
        );

        const canvas =
            document.getElementById(
                "vehicleChart"
            );

        if (!canvas) {
            return;
        }

        if (vehicleChart) {

            vehicleChart.destroy();

            vehicleChart = null;
        }

        if (
            Object.keys(
                counts
            ).length === 0
        ) {

            return;
        }

        if (
            typeof Chart ===
            "undefined"
        ) {

            console.error(
                "Chart.js is not loaded."
            );

            return;
        }

        vehicleChart =
            new Chart(
                canvas,
                {
                    type: "pie",

                    data: {

                        labels:
                            Object.keys(
                                counts
                            ),

                        datasets: [
                            {
                                data:
                                    Object.values(
                                        counts
                                    ),

                                borderWidth:
                                    2
                            }
                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    "bottom"
                            }
                        }
                    }
                }
            );

    } catch (error) {

        console.error(
            "Reports error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Reports failed",
                true
            );
        }
    }
}


/* =====================================================
   EXPORT
===================================================== */

function exportVehicles() {

    if (
        vehicles.length === 0
    ) {

        showToast(
            "No vehicles to export",
            true
        );

        return;
    }

    const headers = [

        "Vehicle Number",
        "Owner Name",
        "Model",
        "Type",
        "Phone",
        "Last Service Date",
        "Next Service Date",
        "Service Cost"

    ];

    const rows =
        vehicles.map(
            vehicle => [

                vehicle.vehicleNumber || "",

                vehicle.ownerName || "",

                vehicle.model || "",

                vehicle.type || "",

                vehicle.phone || "",

                vehicle.lastServiceDate || "",

                vehicle.nextServiceDate || "",

                vehicle.serviceCost || 0

            ]
        );

    downloadCSV(
        "vehicles.csv",
        headers,
        rows
    );

    showToast(
        "Vehicles exported successfully"
    );
}


function exportServices() {

    if (
        services.length === 0
    ) {

        showToast(
            "No services to export",
            true
        );

        return;
    }

    const headers = [

        "Date",
        "Vehicle",
        "Service",
        "Technician",
        "Parts",
        "Labour",
        "Total"

    ];

    const rows =
        services.map(
            service => [

                service.serviceDate || "",

                service.vehicleNumber || "",

                service.serviceType || "",

                service.technician || "",

                service.partsCost || 0,

                service.labourCost || 0,

                service.totalCost || 0

            ]
        );

    downloadCSV(
        "services.csv",
        headers,
        rows
    );

    showToast(
        "Services exported successfully"
    );
}


function downloadCSV(
    filename,
    headers,
    rows
) {

    const csv =
        [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );
}


/* =====================================================
   THEME
===================================================== */

function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );

    const light =
        document.body.classList.contains(
            "light"
        );

    const button =
        document.getElementById(
            "themeButton"
        );

    if (button) {

        button.textContent =
            light
                ? "🌙"
                : "☀️";
    }

    localStorage.setItem(
        "vehiclecare-theme",
        light
            ? "light"
            : "dark"
    );

    const reports =
        document.getElementById(
            "reports"
        );

    if (
        reports &&
        reports.classList.contains(
            "active"
        )
    ) {

        loadReports();
    }
}


function loadTheme() {

    const saved =
        localStorage.getItem(
            "vehiclecare-theme"
        );

    const light =
        saved === "light";

    document.body.classList.toggle(
        "light",
        light
    );

    const button =
        document.getElementById(
            "themeButton"
        );

    if (button) {

        button.textContent =
            light
                ? "🌙"
                : "☀️";
    }
}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    message,
    error = false
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.classList.toggle(
        "error",
        error
    );

    toast.classList.add(
        "show"
    );

    clearTimeout(
        window.toastTimer
    );

    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =====================================================
   START APPLICATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",

    async () => {

        loadTheme();

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                login
            );
        }

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                handleSignup
            );
        }

        if (
            !checkAuthentication()
        ) {

            return;
        }

        if (!accessToken) {

            const refreshed =
                await refreshAccessToken();

            if (!refreshed) {

                logout(false);

                return;
            }
        }

        try {

            const response =
                await apiFetch(
                    `${API}/auth/me`
                );

            if (!response.ok) {

                logout(false);

                return;
            }

            showPage(
                "dashboard"
            );

            await loadVehicles();
            await loadCustomers();
            await loadServices();
            await loadAppointments();
            await loadInvoices();

        } catch (error) {

            console.error(
                "Application startup error:",
                error
            );

            logout(false);
        }
    }
);

async function deleteVehicle(id) {
    if (!id) {
        showToast("Vehicle ID is missing.", true);
        return;
    }

    if (!confirm("Are you sure you want to delete this vehicle?")) {
        return;
    }

    try {
        const response = await apiFetch(
            `${API}/vehicles/${id}`,
            { method: "DELETE" }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Delete failed"
            );
        }

        showToast("Vehicle deleted successfully!");
        await loadVehicles();
        await loadDashboard();

    } catch (error) {
        console.error("Delete vehicle error:", error);
        showToast(error.message || "Failed to delete vehicle.", true);
    }
}
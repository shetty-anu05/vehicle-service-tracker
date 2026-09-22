const API = "/api";

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


async function refreshAccessToken() {

    if (!refreshToken) {
        return false;
    }

    try {

        const response =
            await fetch(
                `${API}/auth/refresh`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refreshToken
                    })
                }
            );

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        accessToken =
            data.accessToken;

        localStorage.setItem(
            "vehiclecare-access-token",
            accessToken
        );

        return true;

    } catch {

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

    const response =
        await fetch(
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

    message.classList.remove("show");

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
        await loadAppointments();
        await loadInvoices();

        showToast(
            "Login successful"
        );

    } catch {

        message.textContent =
            "Unable to connect to server";

        message.classList.add("show");
    }
}


function logout(showMessage = true) {

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

    document
        .getElementById("authScreen")
        .classList.remove("hidden");

    document
        .getElementById("loginUsername")
        .value = "";

    document
        .getElementById("loginPassword")
        .value = "";

    if (showMessage) {

        showToast(
            "Logged out successfully"
        );
    }
}


function checkAuthentication() {

    const authScreen =
        document.getElementById(
            "authScreen"
        );

    if (
        !accessToken &&
        !refreshToken
    ) {

        authScreen.classList.remove(
            "hidden"
        );

        return false;
    }

    authScreen.classList.add(
        "hidden"
    );

    return true;
}


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


async function loadDashboard() {

    try {

        const response =
            await apiFetch(
                `${API}/dashboard`
            );

        if (!response.ok) {
            throw new Error();
        }

        const data =
            await response.json();

        document.getElementById(
            "dashVehicles"
        ).textContent =
            data.totalVehicles || 0;

        document.getElementById(
            "dashServices"
        ).textContent =
            data.totalServices || 0;

        document.getElementById(
            "dashAppointments"
        ).textContent =
            data.totalAppointments || 0;

        document.getElementById(
            "dashRevenue"
        ).textContent =
            `₹${Number(
                data.totalRevenue || 0
            ).toLocaleString("en-IN")}`;

        document.getElementById(
            "dashOverdue"
        ).textContent =
            data.overdue || 0;

        document.getElementById(
            "dashUpcoming"
        ).textContent =
            data.upcoming || 0;

        await loadServiceAlerts();

    } catch (error) {

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
            data.filter(vehicle => {

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
            });

        if (overdue.length === 0) {

            container.innerHTML = `
                <div class="alert">
                    ✅ No vehicles currently require attention.
                </div>
            `;

            return;
        }

        container.innerHTML =
            overdue
                .map(vehicle => `
                    <div class="alert">

                        <strong>
                            ${vehicle.vehicleNumber || "-"}
                        </strong>

                        <span>
                            ${vehicle.ownerName || "-"}
                            - Service overdue
                        </span>

                    </div>
                `)
                .join("");

    } catch {

        container.innerHTML = `
            <div class="alert">
                Unable to load service alerts.
            </div>
        `;
    }
}


async function loadVehicles() {

    try {

        const response =
            await apiFetch(
                `${API}/vehicles`
            );

        if (!response.ok) {
            throw new Error();
        }

        vehicles =
            await response.json();

        displayVehicles(
            vehicles
        );

        populateVehicleSelects();

    } catch (error) {

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

    if (data.length === 0) {

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
            .map(vehicle => {

                let status =
                    "Active";

                if (
                    vehicle.nextServiceDate
                ) {

                    if (
                        new Date(
                            vehicle.nextServiceDate
                        ) < new Date()
                    ) {

                        status =
                            "Overdue";
                    }
                }

                return `
                    <tr>

                        <td>
                            <strong>
                                ${vehicle.vehicleNumber || "-"}
                            </strong>
                        </td>

                        <td>
                            ${vehicle.ownerName || "-"}
                        </td>

                        <td>
                            ${vehicle.model || "-"}
                        </td>

                        <td>
                            ${vehicle.type || "-"}
                        </td>

                        <td>
                            ${vehicle.phone || "-"}
                        </td>

                        <td>
                            ${vehicle.nextServiceDate || "-"}
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
                                    onclick="viewVehicle('${vehicle._id}')">
                                    View
                                </button>

                                <button
                                    class="small-btn"
                                    onclick="editVehicle('${vehicle._id}')">
                                    Edit
                                </button>

                                <button
                                    class="small-btn danger"
                                    onclick="deleteVehicle('${vehicle._id}')">
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


function viewVehicle(id) {

    const vehicle =
        vehicles.find(
            item => item._id === id
        );

    if (!vehicle) {
        return;
    }

    alert(
        `VEHICLE DETAILS\n\n` +
        `Vehicle Number: ${vehicle.vehicleNumber || "-"}\n` +
        `Owner: ${vehicle.ownerName || "-"}\n` +
        `Model: ${vehicle.model || "-"}\n` +
        `Type: ${vehicle.type || "-"}\n` +
        `Phone: ${vehicle.phone || "-"}\n` +
        `Last Service: ${vehicle.lastServiceDate || "-"}\n` +
        `Next Service: ${vehicle.nextServiceDate || "-"}\n` +
        `Service Cost: ₹${Number(
            vehicle.serviceCost || 0
        ).toLocaleString("en-IN")}`
    );
}


function searchVehicles() {
    filterVehicles();
}


function filterVehicles() {

    const search =
        document
            .getElementById("vehicleSearch")
            .value
            .toLowerCase()
            .trim();

    const type =
        document.getElementById(
            "vehicleFilter"
        ).value;

    const filtered =
        vehicles.filter(vehicle => {

            const text =
                `${vehicle.vehicleNumber || ""} ` +
                `${vehicle.ownerName || ""} ` +
                `${vehicle.model || ""} ` +
                `${vehicle.phone || ""}`
                    .toLowerCase();

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
        });

    displayVehicles(filtered);
}


function showVehicleForm() {

    document
        .getElementById("vehicleForm")
        .classList.remove("hidden");
}


function hideVehicleForm() {

    document
        .getElementById("vehicleForm")
        .classList.add("hidden");
}


async function addVehicle() {

    const data = {

        vehicleNumber:
            document
                .getElementById("vehicleNumber")
                .value
                .trim(),

        ownerName:
            document
                .getElementById("ownerName")
                .value
                .trim(),

        model:
            document
                .getElementById("model")
                .value
                .trim(),

        type:
            document.getElementById(
                "type"
            ).value,

        phone:
            document
                .getElementById("phone")
                .value
                .trim(),

        lastServiceDate:
            document.getElementById(
                "lastServiceDate"
            ).value,

        nextServiceDate:
            document.getElementById(
                "nextServiceDate"
            ).value,

        serviceCost:
            Number(
                document.getElementById(
                    "serviceCost"
                ).value || 0
            )
    };


    if (
        !data.vehicleNumber ||
        !data.ownerName ||
        !data.model ||
        !data.type
    ) {

        showToast(
            "Please fill the required vehicle details",
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

        if (!response.ok) {
            throw new Error();
        }

        [
            "vehicleNumber",
            "ownerName",
            "model",
            "phone",
            "lastServiceDate",
            "nextServiceDate",
            "serviceCost"
        ].forEach(id => {

            document.getElementById(
                id
            ).value = "";

        });

        document.getElementById(
            "type"
        ).value = "";

        hideVehicleForm();

        await loadVehicles();
        await loadDashboard();

        showToast(
            "Vehicle added successfully"
        );

    } catch {

        showToast(
            "Failed to add vehicle",
            true
        );
    }
}


async function editVehicle(id) {

    const vehicle =
        vehicles.find(
            item => item._id === id
        );

    if (!vehicle) {
        return;
    }

    const ownerName =
        prompt(
            "Enter owner name:",
            vehicle.ownerName || ""
        );

    if (ownerName === null) {
        return;
    }

    const phone =
        prompt(
            "Enter phone number:",
            vehicle.phone || ""
        );

    if (phone === null) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/vehicles/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            ownerName,
                            phone
                        })
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        await loadVehicles();

        showToast(
            "Vehicle updated successfully"
        );

    } catch {

        showToast(
            "Failed to update vehicle",
            true
        );
    }
}


async function deleteVehicle(id) {

    const vehicle =
        vehicles.find(
            item => item._id === id
        );

    if (!vehicle) {
        return;
    }

    if (
        !confirm(
            `Delete ${vehicle.vehicleNumber}?`
        )
    ) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/vehicles/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        await loadVehicles();
        await loadDashboard();

        showToast(
            "Vehicle deleted successfully"
        );

    } catch {

        showToast(
            "Failed to delete vehicle",
            true
        );
    }
}


function populateVehicleSelects() {

    const select =
        document.getElementById(
            "serviceVehicle"
        );

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">
            Select Vehicle
        </option>` +

        vehicles
            .map(vehicle => `
                <option value="${vehicle._id}">
                    ${vehicle.vehicleNumber} -
                    ${vehicle.ownerName}
                </option>
            `)
            .join("");
}


async function loadServices() {

    try {

        const response =
            await apiFetch(
                `${API}/services`
            );

        if (!response.ok) {
            throw new Error();
        }

        services =
            await response.json();

        displayServices(
            services
        );

        populateVehicleSelects();

    } catch {

        showToast(
            "Failed to load services",
            true
        );
    }
}


function displayServices(data) {

    const tbody =
        document.getElementById(
            "serviceList"
        );

    if (!tbody) {
        return;
    }

    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No service records found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        data
            .map(service => `
                <tr>

                    <td>
                        ${service.serviceDate || "-"}
                    </td>

                    <td>
                        ${service.vehicleNumber || "-"}
                    </td>

                    <td>
                        ${service.serviceType || "-"}
                    </td>

                    <td>
                        ${service.technician || "-"}
                    </td>

                    <td>
                        ₹${Number(
                            service.partsCost || 0
                        ).toLocaleString("en-IN")}
                    </td>

                    <td>
                        ₹${Number(
                            service.labourCost || 0
                        ).toLocaleString("en-IN")}
                    </td>

                    <td>
                        <strong>
                            ₹${Number(
                                service.totalCost || 0
                            ).toLocaleString("en-IN")}
                        </strong>
                    </td>

                </tr>
            `)
            .join("");
}


async function addService() {

    const vehicleId =
        document.getElementById(
            "serviceVehicle"
        ).value;

    if (!vehicleId) {

        showToast(
            "Please select a vehicle",
            true
        );

        return;
    }

    const vehicle =
        vehicles.find(
            item => item._id === vehicleId
        );

    if (!vehicle) {
        return;
    }

    const partsCost =
        Number(
            document.getElementById(
                "partsCost"
            ).value || 0
        );

    const labourCost =
        Number(
            document.getElementById(
                "labourCost"
            ).value || 0
        );

    const data = {

        vehicleId,

        vehicleNumber:
            vehicle.vehicleNumber,

        serviceDate:
            document.getElementById(
                "serviceDate"
            ).value,

        serviceType:
            document.getElementById(
                "serviceType"
            ).value,

        description:
            document.getElementById(
                "serviceDescription"
            ).value
            .trim(),

        technician:
            document.getElementById(
                "technician"
            ).value
            .trim(),

        partsCost,

        labourCost,

        totalCost:
            partsCost + labourCost,

        nextServiceDate:
            document.getElementById(
                "nextService"
            ).value
    };


    try {

        const response =
            await apiFetch(
                `${API}/services`,
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

        if (!response.ok) {
            throw new Error();
        }

        [
            "serviceDate",
            "technician",
            "partsCost",
            "labourCost",
            "nextService",
            "serviceDescription"
        ].forEach(id => {

            document.getElementById(
                id
            ).value = "";

        });

        document.getElementById(
            "serviceVehicle"
        ).value = "";

        document.getElementById(
            "serviceType"
        ).value = "";

        await loadServices();
        await loadVehicles();
        await loadDashboard();

        showToast(
            "Service added successfully"
        );

    } catch {

        showToast(
            "Failed to add service",
            true
        );
    }
}


async function loadCustomers() {

    try {

        const response =
            await apiFetch(
                `${API}/customers`
            );

        if (!response.ok) {
            throw new Error();
        }

        customers =
            await response.json();

        displayCustomers(
            customers
        );

    } catch {

        showToast(
            "Failed to load customers",
            true
        );
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

    if (data.length === 0) {

        container.innerHTML = `
            <div class="panel">
                No customers registered yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data
            .map(customer => `
                <div class="customer-card">

                    <div class="customer-avatar">
                        ${String(
                            customer.name || "C"
                        )
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div class="customer-info">

                        <h3>
                            ${customer.name || "-"}
                        </h3>

                        <p>
                            📞 ${customer.phone || "-"}
                        </p>

                        <p>
                            ✉️ ${customer.email || "-"}
                        </p>

                        <p>
                            📍 ${customer.address || "-"}
                        </p>

                    </div>

                    <button
                        class="small-btn danger"
                        onclick="deleteCustomer('${customer._id}')">
                        Delete
                    </button>

                </div>
            `)
            .join("");
}


async function addCustomer() {

    const data = {

        name:
            document
                .getElementById("customerName")
                .value
                .trim(),

        phone:
            document
                .getElementById("customerPhone")
                .value
                .trim(),

        email:
            document
                .getElementById("customerEmail")
                .value
                .trim(),

        address:
            document
                .getElementById("customerAddress")
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

        if (!response.ok) {
            throw new Error();
        }

        [
            "customerName",
            "customerPhone",
            "customerEmail",
            "customerAddress"
        ].forEach(id => {

            document.getElementById(
                id
            ).value = "";

        });

        await loadCustomers();

        showToast(
            "Customer added successfully"
        );

    } catch {

        showToast(
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

    } catch {

        showToast(
            "Failed to delete customer",
            true
        );
    }
}


async function loadAppointments() {

    try {

        const response =
            await apiFetch(
                `${API}/appointments`
            );

        if (!response.ok) {
            throw new Error();
        }

        appointments =
            await response.json();

        displayAppointments(
            appointments
        );

    } catch {

        showToast(
            "Failed to load appointments",
            true
        );
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

    if (data.length === 0) {

        container.innerHTML = `
            <div class="panel">
                No appointments scheduled.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data
            .map(appointment => `
                <div class="appointment-card">

                    <div class="appointment-header">

                        <h3>
                            ${appointment.customerName || "-"}
                        </h3>

                        <span class="status-badge">
                            ${appointment.status || "Pending"}
                        </span>

                    </div>

                    <p>
                        📞 ${appointment.phone || "-"}
                    </p>

                    <p>
                        🚗 ${appointment.vehicleNumber || "-"}
                    </p>

                    <p>
                        🔧 ${appointment.serviceType || "-"}
                    </p>

                    <p>
                        📅 ${appointment.appointmentDate || "-"}
                    </p>

                    <p>
                        🕒 ${appointment.appointmentTime || "-"}
                    </p>

                    <div class="card-actions">

                        <button
                            class="small-btn"
                            onclick="completeAppointment('${appointment._id}')">
                            Complete
                        </button>

                        <button
                            class="small-btn danger"
                            onclick="deleteAppointment('${appointment._id}')">
                            Delete
                        </button>

                    </div>

                </div>
            `)
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

        if (!response.ok) {
            throw new Error();
        }

        [
            "appointmentCustomer",
            "appointmentPhone",
            "appointmentVehicle",
            "appointmentDate",
            "appointmentTime"
        ].forEach(id => {

            document.getElementById(
                id
            ).value = "";

        });

        document.getElementById(
            "appointmentService"
        ).value = "";

        await loadAppointments();
        await loadDashboard();

        showToast(
            "Appointment booked successfully"
        );

    } catch {

        showToast(
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

                    body:
                        JSON.stringify({
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

    } catch {

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

    } catch {

        showToast(
            "Failed to delete appointment",
            true
        );
    }
}


async function loadInvoices() {

    try {

        const response =
            await apiFetch(
                `${API}/invoices`
            );

        if (!response.ok) {
            throw new Error();
        }

        invoices =
            await response.json();

        displayInvoices(
            invoices
        );

    } catch {

        showToast(
            "Failed to load invoices",
            true
        );
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

    if (data.length === 0) {

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
            .map(invoice => `
                <tr>

                    <td>
                        ${invoice.invoiceNumber || "-"}
                    </td>

                    <td>
                        ${invoice.customerName || "-"}
                    </td>

                    <td>
                        ${invoice.vehicleNumber || "-"}
                    </td>

                    <td>
                        ${invoice.serviceType || "-"}
                    </td>

                    <td>
                        ${invoice.serviceDate || "-"}
                    </td>

                    <td>
                        <strong>
                            ₹${Number(
                                invoice.total || 0
                            ).toLocaleString("en-IN")}
                        </strong>
                    </td>

                    <td>

                        <button
                            class="small-btn"
                            onclick="printInvoice('${invoice._id}')">
                            Print
                        </button>

                    </td>

                </tr>
            `)
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

        if (!response.ok) {
            throw new Error();
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
        ].forEach(id => {

            document.getElementById(
                id
            ).value = "";

        });

        await loadInvoices();
        await loadDashboard();

        showToast(
            "Invoice created successfully"
        );

    } catch {

        showToast(
            "Failed to create invoice",
            true
        );
    }
}


function printInvoice(id) {

    const invoice =
        invoices.find(
            item => item._id === id
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

    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${invoice.invoiceNumber}
            </title>

            <style>

                body {
                    font-family: Arial;
                    padding: 40px;
                    color: #111827;
                }

                h1 {
                    margin-bottom: 5px;
                }

                .line {
                    border-bottom:
                        1px solid #ddd;
                    margin: 20px 0;
                }

                .row {
                    display: flex;
                    justify-content:
                        space-between;
                    padding: 8px 0;
                }

                .total {
                    font-size: 20px;
                    font-weight: bold;
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
                    ${invoice.invoiceNumber || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Customer:</strong>
                <span>
                    ${invoice.customerName || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Phone:</strong>
                <span>
                    ${invoice.phone || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Vehicle:</strong>
                <span>
                    ${invoice.vehicleNumber || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Model:</strong>
                <span>
                    ${invoice.model || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Service:</strong>
                <span>
                    ${invoice.serviceType || "-"}
                </span>
            </div>

            <div class="row">
                <strong>Date:</strong>
                <span>
                    ${invoice.serviceDate || "-"}
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

                window.onload =
                    function() {
                        window.print();
                    };

            <\/script>

        </body>

        </html>
    `);

    printWindow.document.close();
}


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

        document.getElementById(
            "reportVehicles"
        ).textContent =
            dashboard.totalVehicles || 0;

        document.getElementById(
            "reportServices"
        ).textContent =
            dashboard.totalServices || 0;

        document.getElementById(
            "reportRevenue"
        ).textContent =
            `₹${Number(
                dashboard.totalRevenue || 0
            ).toLocaleString("en-IN")}`;


        const vehiclesResponse =
            await apiFetch(
                `${API}/vehicles`
            );

        const data =
            await vehiclesResponse.json();

        const counts = {};

        data.forEach(vehicle => {

            const type =
                vehicle.type ||
                "Other";

            counts[type] =
                (counts[type] || 0) + 1;
        });


        const canvas =
            document.getElementById(
                "vehicleChart"
            );

        if (!canvas) {
            return;
        }


        if (vehicleChart) {

            vehicleChart.destroy();

            vehicleChart =
                null;
        }


        if (
            Object.keys(counts).length === 0
        ) {
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

                                borderWidth: 2
                            }
                        ]
                    },

                    options: {

                        responsive: true,

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

    } catch {

        showToast(
            "Reports failed",
            true
        );
    }
}


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
        vehicles.map(vehicle => [

            vehicle.vehicleNumber || "",
            vehicle.ownerName || "",
            vehicle.model || "",
            vehicle.type || "",
            vehicle.phone || "",
            vehicle.lastServiceDate || "",
            vehicle.nextServiceDate || "",
            vehicle.serviceCost || 0

        ]);


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
        services.map(service => [

            service.serviceDate || "",
            service.vehicleNumber || "",
            service.serviceType || "",
            service.technician || "",
            service.partsCost || 0,
            service.labourCost || 0,
            service.totalCost || 0

        ]);


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
            .map(row =>
                row
                    .map(value =>
                        `"${String(value)
                            .replace(
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
        URL.createObjectURL(blob);


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

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

        if (!checkAuthentication()) {
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
            await loadAppointments();
            await loadInvoices();

        } catch {

            logout(false);
        }
    }
);
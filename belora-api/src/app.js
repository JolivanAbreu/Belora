require("express-async-errors"); // deve vir antes de importar as rotas
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authMiddleware = require("./middlewares/auth");
const publicTenantMiddleware = require("./middlewares/publicTenant");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const tenantsRoutes = require("./modules/tenants/tenants.routes");
const servicesRoutes = require("./modules/services/services.routes");
const servicesPublicRoutes = require("./modules/services/services.public.routes");
const tenantsPublicRoutes = require("./modules/tenants/tenants.public.routes");
const clientsRoutes = require("./modules/clients/clients.routes");
const appointmentsRoutes = require("./modules/appointments/appointments.routes");
const appointmentsPublicRoutes = require("./modules/appointments/appointments.public.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Rotas públicas (booking page) - resolução de tenant por slug ---
// O prefixo "/public/:tenantSlug" garante que req.params.tenantSlug já
// exista quando publicTenantMiddleware roda, então req.tenantId fica
// disponível para todas as rotas montadas em seguida (mergeParams: true).
app.use("/public/:tenantSlug", publicTenantMiddleware, servicesPublicRoutes);
app.use("/public/:tenantSlug", publicTenantMiddleware, appointmentsPublicRoutes);
app.use("/public/:tenantSlug", publicTenantMiddleware, tenantsPublicRoutes);

// --- Rotas autenticadas (painel admin) - tenant resolvido pelo JWT ---
app.use(authRoutes); // /auth/login e /auth/refresh não exigem token
app.use(authMiddleware, tenantsRoutes);
app.use(authMiddleware, servicesRoutes);
app.use(authMiddleware, clientsRoutes);
app.use(authMiddleware, appointmentsRoutes);

app.use(errorHandler); // sempre por último

module.exports = app;

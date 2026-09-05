require("express-async-errors"); // deve vir antes de importar as rotas
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authMiddleware = require("./middlewares/auth");
const publicTenantMiddleware = require("./middlewares/publicTenant");
const publicRateLimiter = require("./middlewares/publicRateLimiter");
const { buildCorsOptions } = require("./config/cors");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const twoFactorRoutes = require("./modules/auth/twoFactor.routes");
const tenantsRoutes = require("./modules/tenants/tenants.routes");
const servicesRoutes = require("./modules/services/services.routes");
const servicesPublicRoutes = require("./modules/services/services.public.routes");
const tenantsPublicRoutes = require("./modules/tenants/tenants.public.routes");
const clientsRoutes = require("./modules/clients/clients.routes");
const appointmentsRoutes = require("./modules/appointments/appointments.routes");
const appointmentsPublicRoutes = require("./modules/appointments/appointments.public.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const reportsRoutes = require("./modules/reports/reports.routes");

const app = express();

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Rotas públicas da booking page.
// O rate limiter roda antes do middleware de tenant para limitar por IP
// mesmo em requisições com slug inexistente.
app.use("/public/:tenantSlug", publicRateLimiter, publicTenantMiddleware, servicesPublicRoutes);
app.use("/public/:tenantSlug", publicRateLimiter, publicTenantMiddleware, appointmentsPublicRoutes);
app.use("/public/:tenantSlug", publicRateLimiter, publicTenantMiddleware, tenantsPublicRoutes);

// Rotas autenticadas do painel admin.
app.use(authRoutes);
app.use(authMiddleware, twoFactorRoutes);
app.use(authMiddleware, tenantsRoutes);
app.use(authMiddleware, servicesRoutes);
app.use(authMiddleware, clientsRoutes);
app.use(authMiddleware, appointmentsRoutes);
app.use(authMiddleware, notificationsRoutes);
app.use(authMiddleware, reportsRoutes);

app.use(errorHandler);

module.exports = app;

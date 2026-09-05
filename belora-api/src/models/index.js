const sequelize = require("../config/database");

const Plan = require("./Plan");
const Tenant = require("./Tenant");
const User = require("./User");
const ServiceCategory = require("./ServiceCategory");
const Service = require("./Service");
const Client = require("./Client");
const Appointment = require("./Appointment");
const AvailabilityBlock = require("./AvailabilityBlock");
const NotificationLog = require("./NotificationLog");



Plan.hasMany(Tenant, { foreignKey: "planId" });
Tenant.belongsTo(Plan, { foreignKey: "planId" });

Tenant.hasMany(User, { foreignKey: "tenantId" });
User.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(ServiceCategory, { foreignKey: "tenantId" });
ServiceCategory.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Service, { foreignKey: "tenantId" });
Service.belongsTo(Tenant, { foreignKey: "tenantId" });

ServiceCategory.hasMany(Service, { foreignKey: "categoryId" });
Service.belongsTo(ServiceCategory, { foreignKey: "categoryId" });

Tenant.hasMany(Client, { foreignKey: "tenantId" });
Client.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Appointment, { foreignKey: "tenantId" });
Appointment.belongsTo(Tenant, { foreignKey: "tenantId" });

Client.hasMany(Appointment, { foreignKey: "clientId" });
Appointment.belongsTo(Client, { foreignKey: "clientId" });

Service.hasMany(Appointment, { foreignKey: "serviceId" });
Appointment.belongsTo(Service, { foreignKey: "serviceId" });

Tenant.hasMany(AvailabilityBlock, { foreignKey: "tenantId" });
AvailabilityBlock.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(NotificationLog, { foreignKey: "tenantId" });
NotificationLog.belongsTo(Tenant, { foreignKey: "tenantId" });

Appointment.hasMany(NotificationLog, { foreignKey: "appointmentId" });
NotificationLog.belongsTo(Appointment, { foreignKey: "appointmentId" });

module.exports = {
  sequelize,
  Plan,
  Tenant,
  User,
  ServiceCategory,
  Service,
  Client,
  Appointment,
  AvailabilityBlock,
  NotificationLog,
};

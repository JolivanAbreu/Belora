const { Service } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

async function list(tenantId) {
  return Service.findAll({ where: { tenantId }, order: [["name", "ASC"]] });
}

async function listPublic(tenantId) {
  return Service.findAll({ where: { tenantId, active: true }, order: [["name", "ASC"]] });
}

async function create(tenantId, data) {
  return Service.create({ ...data, tenantId });
}

async function update(tenantId, serviceId, data) {
  const service = await Service.findOne({ where: { id: serviceId, tenantId } });
  if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "Serviço não encontrado para este tenant.");
  await service.update(data);
  return service;
}

// Soft-delete: preferir desativar a excluir de fato (ver Modelo de Dados, seção 5)
async function deactivate(tenantId, serviceId) {
  const service = await Service.findOne({ where: { id: serviceId, tenantId } });
  if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "Serviço não encontrado para este tenant.");
  service.active = false;
  await service.save();
  return service;
}

module.exports = { list, listPublic, create, update, deactivate };

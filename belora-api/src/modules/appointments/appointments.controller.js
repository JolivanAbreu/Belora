const availabilityService = require("./availability.service");
const appointmentsService = require("./appointments.service");

// --- Uso do Admin (painel) ---

async function listMine(req, res) {
  const { from, to } = req.query;
  const appointments = await appointmentsService.listAppointments(req.user.tenantId, { from, to });
  res.json(appointments);
}

async function createMine(req, res) {
  const appointment = await appointmentsService.createAppointment(req.user.tenantId, req.body);
  res.status(201).json(appointment);
}

async function cancelMine(req, res) {
  const appointment = await appointmentsService.cancelAppointment(req.user.tenantId, req.params.id);
  res.json(appointment);
}

// --- Endpoints públicos (booking page) ---

async function getPublicAvailability(req, res) {
  const { serviceId, date } = req.query;
  const slots = await availabilityService.getAvailableSlots({ tenantId: req.tenantId, serviceId, date });
  res.json({ slots });
}

async function createPublicAppointment(req, res) {
  const appointment = await appointmentsService.createAppointment(req.tenantId, {
    serviceId: req.body.serviceId,
    startsAt: req.body.startsAt,
    client: req.body.client,
  });
  res.status(201).json(appointment);
}

async function createBlock(req, res) {
  const block = await appointmentsService.createAvailabilityBlock(req.user.tenantId, req.body);
  res.status(201).json(block);
}

async function listBlocks(req, res) {
  const { from, to } = req.query;
  const blocks = await appointmentsService.listAvailabilityBlocks(req.user.tenantId, { from, to });
  res.json(blocks);
}

async function deleteBlock(req, res) {
  await appointmentsService.deleteAvailabilityBlock(req.user.tenantId, req.params.id);
  res.status(204).send();
}

module.exports = {
  listMine,
  createMine,
  cancelMine,
  getPublicAvailability,
  createPublicAppointment,
  createBlock,
  listBlocks,
  deleteBlock,
};

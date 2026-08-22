require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, Tenant, User, Service, ServiceCategory } = require("../src/models");

async function seed() {
  await sequelize.authenticate();

  const tenant = await Tenant.create({
    name: "Nicolly Araújo Estética",
    slug: "nicolly",
  });

  const passwordHash = await bcrypt.hash("senha123", 10);
  await User.create({
    tenantId: tenant.id,
    email: "nicolly@exemplo.com",
    passwordHash,
    role: "admin",
  });

  const categoriaFacial = await ServiceCategory.create({ tenantId: tenant.id, name: "Facial" });

  await Service.bulkCreate([
    { tenantId: tenant.id, categoryId: categoriaFacial.id, name: "Limpeza de pele profunda", durationMin: 60, price: 150.0 },
    { tenantId: tenant.id, categoryId: categoriaFacial.id, name: "Extração de cravos", durationMin: 45, price: 90.0 },
    { tenantId: tenant.id, name: "Design de sobrancelhas", durationMin: 30, price: 50.0 },
  ]);

  console.log("Seed concluído.");
  console.log(`Tenant: ${tenant.slug} | Login admin: nicolly@exemplo.com / senha123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});

/**
 * Script de correção pontual: preenche cancellation_token para agendamentos
 * criados ANTES desse campo existir no banco. Rode uma única vez, antes de
 * `npm run db:sync`, se o sync travar com erro de coluna NOT NULL.
 *
 * Uso: node scripts/backfillCancellationToken.js
 */
require("dotenv").config();
const crypto = require("crypto");
const sequelize = require("../src/config/database");

(async () => {
  await sequelize.query(
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_token VARCHAR(255)"
  );

  const [rows] = await sequelize.query(
    "SELECT id FROM appointments WHERE cancellation_token IS NULL"
  );

  for (const row of rows) {
    const token = crypto.randomBytes(20).toString("hex");
    await sequelize.query(
      "UPDATE appointments SET cancellation_token = :token WHERE id = :id",
      { replacements: { token, id: row.id } }
    );
  }

  console.log(`Backfill concluído para ${rows.length} agendamento(s) existente(s).`);
  console.log("Agora rode: npm run db:sync");
  process.exit(0);
})().catch((err) => {
  console.error("Erro no backfill:", err);
  process.exit(1);
});

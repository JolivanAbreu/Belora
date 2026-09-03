const consoleProvider = require("./consoleProvider");
const evolutionApiProvider = require("./evolutionApiProvider");

const PROVIDERS = {
  console: consoleProvider,
  evolution: evolutionApiProvider,
};

/**
 * Retorna o provedor de WhatsApp ativo, escolhido via WHATSAPP_PROVIDER no
 * .env. Padrão: "console" (seguro, não exige credenciais - ver
 * consoleProvider.js). Trocar para "evolution" quando houver uma instância
 * real da Evolution API configurada.
 */
function getWhatsAppProvider() {
  const name = process.env.WHATSAPP_PROVIDER || "console";
  const provider = PROVIDERS[name];
  if (!provider) {
    console.warn(`WHATSAPP_PROVIDER="${name}" desconhecido, usando "console" como fallback.`);
    return consoleProvider;
  }
  return provider;
}

module.exports = { getWhatsAppProvider };

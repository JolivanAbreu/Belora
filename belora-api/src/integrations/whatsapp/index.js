const consoleProvider = require("./consoleProvider");
const evolutionApiProvider = require("./evolutionApiProvider");

const PROVIDERS = {
  console: consoleProvider,
  evolution: evolutionApiProvider,
};

// Provedor ativo definido por WHATSAPP_PROVIDER. Padrão "console".
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

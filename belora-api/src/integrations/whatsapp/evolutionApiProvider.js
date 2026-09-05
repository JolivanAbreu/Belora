// Envio via Evolution API (https://doc.evolution-api.com).
//
// Segue o contrato de POST /message/sendText/{instance} (v2), mas ainda não
// foi validado contra uma instância real. Teste manualmente antes de usar
// em produção.
//
// Variáveis esperadas: EVOLUTION_API_URL, EVOLUTION_API_INSTANCE,
// EVOLUTION_API_KEY (apikey da instância, não a global).
async function send(phone, message) {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_API_INSTANCE;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !instance || !apiKey) {
    return {
      ok: false,
      error: "Evolution API não configurada (EVOLUTION_API_URL/EVOLUTION_API_INSTANCE/EVOLUTION_API_KEY ausentes).",
    };
  }

  // A API espera apenas dígitos, com DDI e sem formatação.
  const numberDigitsOnly = phone.replace(/\D/g, "");

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: numberDigitsOnly,
        text: message,
      }),
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, error: `Evolution API retornou status ${response.status}`, raw };
    }

    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { send };

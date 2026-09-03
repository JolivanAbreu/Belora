/**
 * Provedor real via Evolution API (https://doc.evolution-api.com), uma das
 * opções documentadas na Arquitetura para envio de WhatsApp sem depender
 * da API oficial paga da Meta.
 *
 * IMPORTANTE: esta implementação segue o contrato oficial documentado do
 * endpoint POST /message/sendText/{instance} (Evolution API v2), mas nunca
 * foi exercitada contra uma instância real neste ambiente de
 * desenvolvimento - não há credenciais/servidor Evolution disponíveis
 * aqui. Antes de usar em produção, teste manualmente com uma instância
 * real (ver README, seção "Configurando o lembrete via WhatsApp").
 *
 * Variáveis de ambiente esperadas:
 *   EVOLUTION_API_URL       - ex.: https://sua-evolution.exemplo.com
 *   EVOLUTION_API_INSTANCE  - nome da instância criada na Evolution API
 *   EVOLUTION_API_KEY       - apikey da instância (não a global)
 */
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

  // Evolution API espera o número sem "+" e sem formatação (apenas dígitos, com DDI).
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

// Provedor padrão: registra a mensagem no log em vez de enviar.
// Permite testar todo o fluxo de lembretes sem uma conta de WhatsApp.
//
// Contrato de um provedor:
//   send(phone, message) -> Promise<{ ok, raw?, error? }>
//   Nunca lança exceção: falhas retornam { ok: false, error }.
async function send(phone, message) {
  console.log(`[WhatsApp:console] Para ${phone}: ${message}`);
  return { ok: true, raw: { simulated: true } };
}

module.exports = { send };

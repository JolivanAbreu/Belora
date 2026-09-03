/**
 * Contrato que qualquer provedor de WhatsApp deve implementar (ver
 * Documento de Arquitetura, seção 5 - "adaptador de notificação
 * desacoplado"). Trocar de provedor é só implementar essa mesma interface
 * e apontar WHATSAPP_PROVIDER para o novo nome em factory.js.
 *
 * send(phone, message) -> Promise<{ ok: boolean, raw?: any, error?: string }>
 *   - phone: telefone no formato armazenado em clients.phone (ex.: "+5585999999999")
 *   - message: texto puro da mensagem
 *   - nunca deve lançar exceção: falhas de envio devem retornar { ok: false, error }
 *     para que o chamador decida o que fazer (log, retry futuro, etc.),
 *     sem derrubar o fluxo que disparou o envio (ex.: criação de agendamento).
 */

/**
 * Provedor "console": não envia nada de verdade, apenas registra a
 * mensagem no log do servidor. É o padrão (WHATSAPP_PROVIDER=console ou
 * ausente) porque funciona em qualquer ambiente sem exigir conta/token de
 * WhatsApp, e permite testar toda a lógica de disparo e de agendamento dos
 * lembretes com segurança antes de conectar um provedor real.
 */
async function send(phone, message) {
  console.log(`[WhatsApp:console] Para ${phone}: ${message}`);
  return { ok: true, raw: { simulated: true } };
}

module.exports = { send };

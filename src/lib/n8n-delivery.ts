export type DeliveryResult = { accepted: true } | { accepted: false; message: string };

export async function deliverToN8n(url: string, payload: object, id: string, request: typeof fetch = fetch): Promise<DeliveryResult> {
  try {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.username || target.password) {
      return { accepted: false, message: 'A integração com o n8n não está configurada corretamente. Tente novamente após a configuração.' };
    }
    const response = await request(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': id },
      body: JSON.stringify(payload),
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    if (response.status < 200 || response.status >= 300) {
      return { accepted: false, message: 'O n8n não confirmou o recebimento da solicitação. Seus dados foram mantidos; tente novamente.' };
    }
    return { accepted: true };
  } catch {
    return { accepted: false, message: 'Não foi possível confirmar o recebimento pelo n8n. Verifique sua conexão e tente novamente.' };
  }
}
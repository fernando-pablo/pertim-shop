import { connection, NextResponse } from 'next/server';
import { contactUrl } from '@/lib/contact';

/**
 * /contato: o botão "Quero um sistema assim" passa por aqui. O número do
 * WhatsApp é lido da configuração a cada clique, no servidor, então ele
 * não fica escrito no código nem aparece no HTML da página.
 */
export async function GET() {
  await connection();
  return NextResponse.redirect(contactUrl(process.env.CONTACT_WHATSAPP));
}

import type { ReactNode } from 'react';

/**
 * Link "Quero um sistema assim". Abre em outra aba (ou no app do
 * WhatsApp), para a pessoa não perder a página em que estava.
 */
export function ContactLink({
  className,
  children = 'Quero um sistema assim',
}: {
  className: string;
  children?: ReactNode;
}) {
  return (
    <a
      href="/contato"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export const CONTACT_EMAIL = 'info@dommia.com.mx';

export function contactMailto(subject: string, lines: string[] = []) {
  const body = lines.length ? `&body=${encodeURIComponent(lines.join('\n'))}` : '';
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body}`;
}

export const DEMO_MAILTO = contactMailto('Solicitud de demostración DOMMIA');
export interface ClientErrorState {
  title: string;
  description: string;
  actionText?: string;
  type: 'network' | 'auth' | 'permission' | 'notFound' | 'conflict' | 'rateLimit' | 'server' | 'validation';
}

/**
 * Parses any error into a safe, human-readable, empathetic client-facing message.
 * Prevents technical data leaks (SQL, stack traces, raw HTTP status codes in English).
 */
export function parseClientError(error: unknown, fallbackDescription?: string): ClientErrorState {
  // 1. Offline / Network Errors
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      title: 'Sin conexión a internet',
      description: 'Verifica tu conexión de red Wi-Fi o datos móviles e intenta nuevamente.',
      actionText: 'Reconectar',
      type: 'network',
    };
  }

  const rawMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  if (
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('fetch failed') ||
    rawMsg.includes('ECONNREFUSED')
  ) {
    return {
      title: 'No fue posible conectar con el servidor',
      description: 'Por favor verifica tu conexión a internet o intenta nuevamente en unos momentos.',
      actionText: 'Reintentar',
      type: 'network',
    };
  }

  // 2. HTTP Status Codes / Response Objects
  let status: number | undefined;
  let serverMessage: string | undefined;

  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      status = (error as { status: number }).status;
    }
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      serverMessage = (error as { message: string }).message;
    }
  }

  if (status === 401 || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.toLowerCase().includes('jwt expired')) {
    return {
      title: 'Sesión finalizada',
      description: 'Por motivos de seguridad tu sesión ha expirado. Por favor ingresa nuevamente a tu cuenta.',
      actionText: 'Iniciar Sesión',
      type: 'auth',
    };
  }

  if (status === 403 || rawMsg.toLowerCase().includes('forbidden') || rawMsg.toLowerCase().includes('permisos')) {
    return {
      title: 'Acceso restringido',
      description: 'No cuentas con los permisos necesarios para realizar esta consulta o acción.',
      actionText: 'Volver',
      type: 'permission',
    };
  }

  if (status === 404 || rawMsg.toLowerCase().includes('not found')) {
    return {
      title: 'Información no encontrada',
      description: 'El elemento o recurso solicitado no está disponible o fue retirado.',
      actionText: 'Regresar',
      type: 'notFound',
    };
  }

  if (status === 409 || rawMsg.toLowerCase().includes('conflict') || rawMsg.toLowerCase().includes('duplicate') || rawMsg.toLowerCase().includes('ya existe')) {
    return {
      title: 'Registro duplicado',
      description: 'Ya existe un registro con estos mismos datos identificadores.',
      type: 'conflict',
    };
  }

  if (status === 429 || rawMsg.toLowerCase().includes('too many requests') || rawMsg.toLowerCase().includes('throttler')) {
    return {
      title: 'Límite de solicitudes alcanzado',
      description: 'Por protección del sistema, por favor espera un momento antes de volver a intentar.',
      actionText: 'Reintentar',
      type: 'rateLimit',
    };
  }

  if (status && status >= 500) {
    return {
      title: 'Servicio no disponible temporalmente',
      description: 'Estamos realizando ajustes en la plataforma. Por favor reintenta en unos instantes.',
      actionText: 'Reintentar',
      type: 'server',
    };
  }

  // 3. Technical keywords sanitize (never show SQL, internal server error, or database errors)
  const isTechnicalLeak =
    rawMsg.toLowerCase().includes('internal server error') ||
    rawMsg.toLowerCase().includes('syntax error') ||
    rawMsg.toLowerCase().includes('column') ||
    rawMsg.toLowerCase().includes('relation') ||
    rawMsg.toLowerCase().includes('postgres') ||
    rawMsg.toLowerCase().includes('sql') ||
    rawMsg.toLowerCase().includes('undefined') ||
    rawMsg.toLowerCase().includes('null');

  if (isTechnicalLeak) {
    return {
      title: 'No pudimos cargar la información',
      description: fallbackDescription || 'Ocurrió un inconveniente temporal al procesar la solicitud. Por favor intenta de nuevo.',
      actionText: 'Reintentar',
      type: 'server',
    };
  }

  // 4. Validated human message
  return {
    title: 'Aviso de la plataforma',
    description: serverMessage || (rawMsg.length > 0 && !isTechnicalLeak ? rawMsg : fallbackDescription || 'No se pudo completar la operación.'),
    actionText: 'Reintentar',
    type: 'validation',
  };
}

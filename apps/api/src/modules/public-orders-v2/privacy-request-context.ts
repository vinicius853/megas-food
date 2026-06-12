import type { Request } from 'express';

import type { PrivacyRequestContext } from './privacy-consent';

export function getPrivacyRequestContext(
  request: Request,
): PrivacyRequestContext {
  return {
    ip: request.ip || request.socket?.remoteAddress,
    userAgent: request.get('user-agent'),
  };
}

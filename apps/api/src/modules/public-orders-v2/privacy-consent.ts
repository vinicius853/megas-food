import { BadRequestException } from '@nestjs/common';

export const PRIVACY_POLICY_VERSION = '2026-06-12';

export type PrivacyRequestContext = {
  ip?: string;
  userAgent?: string;
};

export function assertCurrentPrivacyConsent(
  accepted: boolean,
  policyVersion: string,
) {
  if (!accepted) {
    throw new BadRequestException(
      'Aceite a Politica de Privacidade para finalizar o pedido.',
    );
  }

  if (policyVersion !== PRIVACY_POLICY_VERSION) {
    throw new BadRequestException(
      'A Politica de Privacidade foi atualizada. Revise o aceite e tente novamente.',
    );
  }
}

export function sanitizePrivacyContext(context?: PrivacyRequestContext) {
  return {
    ip: limit(context?.ip, 128),
    userAgent: limit(context?.userAgent, 512),
  };
}

function limit(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

import { COOKIE_CONSENT_STORAGE_KEY } from "../../lib/legal";

type ConsentStorage = Pick<Storage, "getItem" | "setItem">;

export function hasCookieConsent(storage: ConsentStorage) {
  return Boolean(storage.getItem(COOKIE_CONSENT_STORAGE_KEY));
}

export function saveCookieConsent(
  storage: ConsentStorage,
  acceptedAt = new Date(),
) {
  storage.setItem(COOKIE_CONSENT_STORAGE_KEY, acceptedAt.toISOString());
}

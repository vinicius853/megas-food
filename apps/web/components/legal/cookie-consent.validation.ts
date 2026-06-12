import assert from "node:assert/strict";

import { COOKIE_CONSENT_STORAGE_KEY } from "../../lib/legal";
import { hasCookieConsent, saveCookieConsent } from "./cookie-consent";

const values = new Map<string, string>();
const storage = {
  getItem(key: string) {
    return values.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    values.set(key, value);
  },
};

assert.equal(hasCookieConsent(storage), false);

saveCookieConsent(storage, new Date("2026-06-12T12:00:00.000Z"));

assert.equal(hasCookieConsent(storage), true);
assert.equal(
  values.get(COOKIE_CONSENT_STORAGE_KEY),
  "2026-06-12T12:00:00.000Z",
);

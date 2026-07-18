/**
 * In-memory access-token holder shared by the axios clients and AuthContext.
 * Kept out of the client module to avoid an import cycle.
 */
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function getAccessToken() {
  return accessToken;
}
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}
export function fireUnauthorized() {
  onUnauthorized?.();
}

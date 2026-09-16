// Reads a JWT's payload WITHOUT verifying the signature. This is safe
// here only because it's used for UI routing (which backend endpoint to
// call), never for trusting a claim as fact — the backend re-verifies
// the token's signature on every request regardless.
export const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};
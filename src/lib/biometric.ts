// Lightweight WebAuthn-based local lock.
// We don't verify on a server — this is a "presence check" that gates UI access.
// Stores the credential ID locally so we can ask for the same authenticator again.

const KEY_ENABLED = "fluxo:biolock:enabled:v1";
const KEY_CREDENTIAL = "fluxo:biolock:credId:v1";

export function isBiometricSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.credentials
  );
}

export function isLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY_ENABLED) === "1";
}

function randomChallenge(): ArrayBuffer {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return a.buffer.slice(a.byteOffset, a.byteOffset + a.byteLength) as ArrayBuffer;
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(s: string): ArrayBuffer {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function enableBiometricLock(userName = "fluxo-user"): Promise<boolean> {
  if (!isBiometricSupported()) throw new Error("Biometria não suportada neste dispositivo.");

  const challenge = randomChallenge();
  const userId = randomChallenge();

  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Fluxo", id: window.location.hostname },
      user: {
        id: userId,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!cred) return false;

  window.localStorage.setItem(KEY_CREDENTIAL, bufToB64(cred.rawId));
  window.localStorage.setItem(KEY_ENABLED, "1");
  return true;
}

export function disableBiometricLock() {
  window.localStorage.removeItem(KEY_ENABLED);
  window.localStorage.removeItem(KEY_CREDENTIAL);
}

export async function verifyBiometric(): Promise<boolean> {
  if (!isBiometricSupported()) return true;
  const credIdB64 = window.localStorage.getItem(KEY_CREDENTIAL);
  const challenge = randomChallenge();

  const allowCredentials = credIdB64
    ? [{ id: b64ToBuf(credIdB64), type: "public-key" as const }]
    : undefined;

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: "required",
      timeout: 60_000,
    },
  });
  return !!assertion;
}

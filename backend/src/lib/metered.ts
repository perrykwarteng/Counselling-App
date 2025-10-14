import axios from "axios";
import { env } from "../config";

/** Ensure domain like "your-subdomain.metered.live" (no protocol, no path) */
function getDomain(): string {
  const domain = (env.METERED_DOMAIN || "").trim();
  if (!domain) throw new Error("METERED_DOMAIN not set");
  if (!/^[a-z0-9-]+\.metered\.(live|ca)$/i.test(domain)) {
    throw new Error(
      `METERED_DOMAIN must look like "your-subdomain.metered.live", got "${domain}"`
    );
  }
  return domain;
}

/** Allow either env var name for server key */
function getSecret(): string {
  const key = (env.METERED_SECRET || env.METERED_API_KEY || "").trim();
  if (!key) throw new Error("METERED_SECRET not set");
  return key;
}

/** Add secretKey to query string for every request (Metered requirement) */
function authParams() {
  return { secretKey: getSecret() };
}

export const meteredHttp = axios.create({
  baseURL: `https://${getDomain()}`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Create room (v2). 409 means it already exists. */
export async function meteredCreateRoom(roomName: string) {
  const body = { roomName };
  return meteredHttp.post("/api/v2/rooms", body, { params: authParams() });
}

/**
 * Ensure room exists (idempotent).
 * Swallows 409 Already Exists, throws on anything else.
 */
export async function meteredEnsureRoom(roomName: string) {
  try {
    await meteredCreateRoom(roomName);
  } catch (e: any) {
    const status =
      e?.response?.status ??
      e?.status ??
      (typeof e?.code === "number" ? e.code : undefined);
    if (status !== 409) throw e;
  }
}

/** Generate an access token (v2). */
export async function meteredGenerateAccessToken(args: {
  roomName: string;
  name?: string;
  externalUserId?: string;
  isAdmin?: boolean;
}) {
  const role = args.isAdmin ? "host" : "guest";
  const payload = {
    role,
    participantName: args.name || args.externalUserId || "User",
    metadata: { externalUserId: args.externalUserId },
    // expirationTimeInSeconds: 3600, // optional
  };
  const { data } = await meteredHttp.post(
    `/api/v2/rooms/${encodeURIComponent(args.roomName)}/tokens`,
    payload,
    { params: authParams() }
  );
  // returns { token, ... }
  return data;
}

/** Fetch ICE servers (optional but helpful, still v1 here) */
export async function meteredGetTurnIceServers() {
  const { data } = await meteredHttp.get("/api/v1/turn/credentials", {
    params: { ...authParams(), preference: "all" },
  });
  return data?.iceServers || [];
}

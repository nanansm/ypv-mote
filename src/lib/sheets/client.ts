import { getSheetsConfig } from "@/lib/config";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_EXPIRY_SKEW_MS = 5 * 60 * 1000;

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
  cacheKey: string;
}

let cachedToken: CachedToken | null = null;

function base64UrlEncode(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const unescaped = pem.replace(/\\n/g, "\n");
  const base64 = unescaped
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signJwt(
  credentials: ServiceAccountCredentials,
  tokenUri: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: credentials.client_email,
    scope: SPREADSHEETS_SCOPE,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claims)
  )}`;

  const key = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function makeCacheKey(credentials: ServiceAccountCredentials): string {
  return `${credentials.client_email}:${credentials.private_key.slice(0, 40)}`;
}

async function getAccessToken(
  credentials: ServiceAccountCredentials
): Promise<string> {
  const cacheKey = makeCacheKey(credentials);
  const now = Date.now();

  if (
    cachedToken &&
    cachedToken.cacheKey === cacheKey &&
    cachedToken.expiresAt - TOKEN_EXPIRY_SKEW_MS > now
  ) {
    return cachedToken.accessToken;
  }

  const tokenUri = credentials.token_uri || DEFAULT_TOKEN_URI;
  const jwt = await signJwt(credentials, tokenUri);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to obtain Google access token (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
    cacheKey,
  };
  return cachedToken.accessToken;
}

interface ValuesResponse {
  data: {
    values?: string[][];
    updates?: { updatedRange?: string };
  };
}

interface ValuesRequestParams {
  spreadsheetId: string;
  range: string;
  valueInputOption: string;
  requestBody: { values: unknown[][] };
}

interface SheetsValuesClient {
  get(params: { spreadsheetId: string; range: string }): Promise<ValuesResponse>;
  update(params: ValuesRequestParams): Promise<ValuesResponse>;
  append(params: ValuesRequestParams): Promise<ValuesResponse>;
  clear(params: { spreadsheetId: string; range: string }): Promise<ValuesResponse>;
}

function createSheetsValuesClient(
  getToken: () => Promise<string>
): SheetsValuesClient {
  async function request(
    method: string,
    url: string,
    body?: unknown
  ): Promise<ValuesResponse> {
    const token = await getToken();
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Sheets API error (${res.status}): ${errText}`);
    }
    if (res.status === 204) {
      return { data: {} };
    }
    const data = (await res.json()) as {
      values?: string[][];
      updates?: { updatedRange?: string };
    };
    return { data };
  }

  return {
    get({ spreadsheetId, range }) {
      const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      return request("GET", url);
    },
    update({ spreadsheetId, range, valueInputOption, requestBody }) {
      const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}?valueInputOption=${valueInputOption}`;
      return request("PUT", url, requestBody);
    },
    append({ spreadsheetId, range, valueInputOption, requestBody }) {
      const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}:append?valueInputOption=${valueInputOption}`;
      return request("POST", url, requestBody);
    },
    clear({ spreadsheetId, range }) {
      const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}:clear`;
      return request("POST", url, {});
    },
  };
}

export async function getSheetsClient() {
  const cfg = await getSheetsConfig();

  if (!cfg.serviceAccountJson) {
    throw new Error("Google Sheets service account JSON not configured");
  }

  const credentials = JSON.parse(
    cfg.serviceAccountJson
  ) as ServiceAccountCredentials;

  const sheets = {
    spreadsheets: {
      values: createSheetsValuesClient(() => getAccessToken(credentials)),
    },
  };

  return { sheets, sheetId: cfg.sheetId, tabName: cfg.tabName };
}

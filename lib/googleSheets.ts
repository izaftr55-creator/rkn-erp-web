import { google } from "googleapis";

const ranges = {
  owners: "MASTER_OWNER!A:E",
  stores: "MASTER_STORE!A:I",
  products: "MASTER_PRODUCT!A:I",
  listings: "MASTER_LISTING!A:U",
  skuColors: "MASTER_SKU_COLOR!A:J",
  colors: "MASTER_COLOR!A:E"
} as const;

export type ResourceName = keyof typeof ranges;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Google Sheets credentials are not configured.");
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

export async function readResource(resource: ResourceName) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing.");

  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: ranges[resource]
  });

  const rows = res.data.values ?? [];
  if (!rows.length) return [];

  const [headers, ...data] = rows;
  return data
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) =>
      Object.fromEntries(headers.map((header, i) => [header, row[i] ?? ""]))
    );
}

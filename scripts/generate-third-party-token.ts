import { createCipheriv, randomBytes } from "crypto";

const THIRD_PARTY_SECRET = process.env.THIRD_PARTY_SECRET || "";

if (!THIRD_PARTY_SECRET) {
  console.error("Error: THIRD_PARTY_SECRET environment variable is not set");
  process.exit(1);
}

const userId = process.argv[2];
const expiresInMinutes = parseInt(process.argv[3] || "60", 10);

if (!userId) {
  console.error("Usage: tsx scripts/generate-third-party-token.ts <steamUserId> [expiresInMinutes]");
  console.error("Example: tsx scripts/generate-third-party-token.ts 76561198000000000 60");
  process.exit(1);
}

function encryptToken(userId: string, expiresInMinutes: number): string {
  const payload = {
    userId,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };

  const iv = randomBytes(16);
  const key = Buffer.from(THIRD_PARTY_SECRET, "utf-8").subarray(0, 32);
  const cipher = createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), "utf-8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

const token = encryptToken(userId, expiresInMinutes);
console.log("\nGenerated Third-Party Access Token:");
console.log("====================================");
console.log(`User ID: ${userId}`);
console.log(`Expires in: ${expiresInMinutes} minutes`);
console.log(`Token: ${token}`);
console.log("\nUse this URL to authenticate:");
console.log(`http://localhost:3000/auth/third-party?access_token=${encodeURIComponent(token)}`);
console.log("");


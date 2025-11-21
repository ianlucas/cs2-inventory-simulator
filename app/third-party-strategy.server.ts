import { fail } from "@ianlucas/cs2-lib";
import { createDecipheriv } from "crypto";
import { Strategy } from "remix-auth/strategy";
import SteamAPI, { UserSummary } from "steamapi";
import { z } from "zod";
import { THIRD_PARTY_SECRET } from "./env.server";
import { steamApiKey } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

namespace ThirdPartyStrategy {
  export type VerifyOptions = {
    request: Request;
    userId: string;
  };
}

export class ThirdPartyStrategy extends Strategy<
  string,
  ThirdPartyStrategy.VerifyOptions
> {
  name = "third-party";

  constructor() {
    super(
      async ({ userId }) =>
        await upsertUser(
          (await new SteamAPI(await steamApiKey.get()).getUserSummary(
            userId
          )) as UserSummary
        )
    );
  }

  async authenticate(request: Request) {
    const url = new URL(request.url);
    const encryptedToken = z.string().parse(url.searchParams.get("access_token"));

    try {
      const userId = this.decryptToken(encryptedToken);
      return await this.verify({ userId, request });
    } catch (error) {
      fail("Invalid or expired token.");
    }
  }

  private decryptToken(encryptedToken: string): string {
    try {
      const parts = encryptedToken.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid token format");
      }

      const [ivHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const encrypted = Buffer.from(encryptedHex, "hex");

      const key = Buffer.from(THIRD_PARTY_SECRET, "utf-8").subarray(0, 32);
      const decipher = createDecipheriv("aes-256-cbc", key, iv);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      const payload = JSON.parse(decrypted.toString("utf-8"));
      const { userId, exp } = z
        .object({
          userId: z.string(),
          exp: z.number()
        })
        .parse(payload);

      if (Date.now() > exp) {
        throw new Error("Token expired");
      }

      return userId;
    } catch (error) {
      throw new Error("Failed to decrypt token");
    }
  }
}


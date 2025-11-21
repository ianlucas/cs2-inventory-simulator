# Third-Party Authentication

This feature allows external services to authenticate users via encrypted Steam user tokens.

## Setup

1. Add the `THIRD_PARTY_SECRET` environment variable to your `.env` file:
   ```
   THIRD_PARTY_SECRET="your-secret-key-for-third-party-auth"
   ```
   **Important**: Use a strong secret key (32+ characters recommended). This key must be shared securely with the third-party service.

2. Restart your application to load the new environment variable.

## How It Works

1. The third-party service encrypts a payload containing:
   - `userId`: Steam user ID (e.g., `76561198000000000`)
   - `exp`: Expiration timestamp in milliseconds

2. The encrypted token is sent to your service via URL:
   ```
   https://yourservice.com/auth/third-party?access_token=<encrypted_token>
   ```

3. Your service decrypts the token, validates the expiration, and creates a session for the user.

## Token Format

The token uses AES-256-CBC encryption with the following format:
```
<iv_hex>:<encrypted_payload_hex>
```

Where:
- `iv_hex`: 16-byte initialization vector (hex encoded)
- `encrypted_payload_hex`: Encrypted JSON payload (hex encoded)

## Generating Tokens (for Third-Party Services)

### Using the Helper Script

For testing, you can generate tokens using the included script:

```bash
tsx scripts/generate-third-party-token.ts <steamUserId> [expiresInMinutes]
```

Example:
```bash
tsx scripts/generate-third-party-token.ts 76561198000000000 60
```

### Node.js Implementation

```typescript
import { createCipheriv, randomBytes } from "crypto";

function generateThirdPartyToken(
  userId: string,
  expiresInMinutes: number,
  secret: string
): string {
  const payload = {
    userId,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };

  const iv = randomBytes(16);
  const key = Buffer.from(secret, "utf-8").subarray(0, 32);
  const cipher = createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), "utf-8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

const token = generateThirdPartyToken("76561198000000000", 60, "your-secret-key");
const url = `https://yourservice.com/auth/third-party?access_token=${encodeURIComponent(token)}`;
```

### Python Implementation

```python
import json
import time
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from urllib.parse import quote

def generate_third_party_token(user_id: str, expires_in_minutes: int, secret: str) -> str:
    payload = {
        "userId": user_id,
        "exp": int((time.time() + expires_in_minutes * 60) * 1000)
    }
    
    iv = get_random_bytes(16)
    key = secret.encode('utf-8')[:32].ljust(32, b'\0')
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    payload_bytes = json.dumps(payload).encode('utf-8')
    padding_length = 16 - (len(payload_bytes) % 16)
    padded_payload = payload_bytes + bytes([padding_length] * padding_length)
    
    encrypted = cipher.encrypt(padded_payload)
    
    return f"{iv.hex()}:{encrypted.hex()}"

token = generate_third_party_token("76561198000000000", 60, "your-secret-key")
url = f"https://yourservice.com/auth/third-party?access_token={quote(token)}"
```

## Security Considerations

1. **Secret Key**: Keep `THIRD_PARTY_SECRET` secure and never expose it publicly
2. **HTTPS**: Always use HTTPS in production to prevent token interception
3. **Token Expiration**: Set reasonable expiration times (recommended: 5-60 minutes)
4. **One-time Use**: Tokens are automatically invalidated after successful authentication
5. **User Validation**: The system validates that the Steam user exists before creating a session

## Error Handling

If authentication fails, users are redirected to:
```
/?error=FailedToValidate
```

Common failure reasons:
- Invalid token format
- Decryption failure (wrong secret)
- Expired token
- Invalid Steam user ID


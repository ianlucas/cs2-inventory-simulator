/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Config } from "@react-router/dev/config";

export default {
  // Allows any Origin: behind a TLS-terminating proxy the request URL is `http://`, so React
  // Router's check would reject every `https://` submission. It only covers `.data` requests
  // anyway, since every action lives in an `api.*` resource route, which it never checks.
  allowedActionOrigins: ["**"]
} satisfies Config;

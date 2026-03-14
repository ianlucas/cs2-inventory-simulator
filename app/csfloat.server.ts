/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CSFloatItemInfo } from "@ianlucas/cs2-lib-inspect";
import { csFloatHeaders, csFloatUrl } from "./models/rule.server";
import {
  badGateway,
  internalServerError,
  serviceUnavailable
} from "./responses.server";

export async function fetchCSFloatItemInfo(inspectLink: string) {
  const url = await csFloatUrl.get();
  if (url === "") {
    throw serviceUnavailable;
  }
  const headerPairs = await csFloatHeaders.get();
  if (headerPairs.length % 2 !== 0) {
    throw internalServerError;
  }
  const headers: Record<string, string> = {};
  for (let i = 0; i < headerPairs.length; i += 2) {
    headers[headerPairs[i]] = headerPairs[i + 1];
  }
  const parsedUrl = new URL(url);
  const existingParams = [...parsedUrl.searchParams.keys()];
  if (existingParams.length > 0) {
    const lastKey = existingParams[existingParams.length - 1];
    const lastValue = parsedUrl.searchParams.get(lastKey);
    parsedUrl.searchParams.set(
      lastKey,
      `${lastValue}?url=${encodeURIComponent(inspectLink)}`
    );
  } else {
    parsedUrl.searchParams.set("url", inspectLink);
  }
  const response = await fetch(parsedUrl.toString(), { headers });
  if (!response.ok) {
    throw badGateway;
  }
  try {
    return (await response.json()) as { iteminfo: CSFloatItemInfo };
  } catch {
    throw badGateway;
  }
}

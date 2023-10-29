/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const notFound = new Response(null, {
  status: 404
});

export const noContent = new Response(null, {
  status: 204
});

export function res(body: string, mimeType: string) {
  return new Response(body, {
    headers: { "Content-Type": mimeType }
  });
}

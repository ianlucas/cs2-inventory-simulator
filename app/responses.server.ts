/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const noContent = new Response(null, {
  status: 204
});

export const badRequest = new Response(null, {
  status: 400
});

export const unauthorized = new Response(null, {
  status: 401
});

export const notFound = new Response(null, {
  status: 404
});

export const methodNotAllowed = new Response(null, {
  status: 405
});

export const conflict = new Response(null, {
  status: 409
});

export function res(body: string, mimeType: string) {
  return new Response(body, {
    headers: { "Content-Type": mimeType }
  });
}

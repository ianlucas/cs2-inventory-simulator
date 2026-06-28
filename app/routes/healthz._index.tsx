/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export async function loader() {
  return new Response("Supposedly healthy", {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}

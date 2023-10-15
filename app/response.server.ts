/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

export const notFound = new Response(null, {
  status: 404
});

export const noContent = new Response(null, {
  status: 204
});

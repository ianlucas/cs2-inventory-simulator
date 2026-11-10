/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { logError } from "./shared/monitoring";

const BAD_REQUEST_MESSAGE =
  "Please check this endpoint's documentation for the correct request parameters.";

function errorResponse(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw errorResponse(BAD_REQUEST_MESSAGE, 400);
    }
    throw error;
  }
}

export function api<T, U>(action: (args: T) => Promise<U>) {
  return async function handler(args: T): Promise<U> {
    try {
      return await action(args);
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      let errorMessage = "Internal server error";
      let shouldLog = true;
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.name === "ZodError") {
          errorMessage = BAD_REQUEST_MESSAGE;
          shouldLog = false;
          statusCode = 400;
        }
      }
      if (shouldLog) {
        logError("API request failed.", { error });
      }
      throw errorResponse(errorMessage, statusCode);
    }
  };
}

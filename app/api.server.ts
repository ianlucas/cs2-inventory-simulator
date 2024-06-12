/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function api<T, U>(action: (args: T) => Promise<U>) {
  return async function handler(args: T): Promise<U> {
    try {
      return await action(args);
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      let errorMessage = "Internal server error";
      let logError = true;
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.name === "ZodError") {
          errorMessage =
            "Please check this endpoint's documentation for the correct request parameters.";
          logError = false;
          statusCode = 400;
        }
      }
      if (logError) {
        console.error(error);
      }
      throw new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  };
}

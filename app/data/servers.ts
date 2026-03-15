/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ServerEntry {
  host: string;
  port?: number;
}

/** List of CS2 servers to query via gamedig. Port optional; gamedig uses game default (27015) if omitted. */
export const SERVER_LIST: ServerEntry[] = [
  { host: "127.0.0.1", port: 27015 }
];

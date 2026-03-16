/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ServerEntry {
  host: string;
  port?: number;
  /** Gamemode (e.g. "retake", "surf"). Shown as card badge; "retake" puts score-0 players in Spectators. */
  gamemode?: string;
}

/** List of CS2 servers to query via gamedig. Port optional; gamedig uses game default (27015) if omitted. */
export const SERVER_LIST: ServerEntry[] = [
  { host: "213.146.165.57", port: 27015, gamemode: "retake" },
  { host: "213.146.165.58", port: 27015, gamemode: "retake" },
  { host: "213.146.165.59", port: 27015, gamemode: "retake" },
  { host: "213.146.165.60", port: 27015, gamemode: "retake" }
];

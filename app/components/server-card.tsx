/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMapThumbnailUrl } from "~/data/map-thumbnails";

/** Server item from homepage loader: gamedig state or offline placeholder. */
export interface ServerCardServer {
  name?: string;
  map?: string;
  numplayers?: number;
  maxplayers?: number;
  connect?: string;
  ping?: number;
  offline?: true;
  host?: string;
  port?: number;
}

export interface ServerCardProps {
  server: ServerCardServer;
  onSelect?: (server: ServerCardServer) => void;
}

export function ServerCard({ server, onSelect }: ServerCardProps) {
  const isOffline = "offline" in server && server.offline === true;
  const mapName = server.map ?? "";
  const bgUrl = getMapThumbnailUrl(mapName);
  const displayName = isOffline ? "Offline" : (server.name ?? "Unknown server");
  const displayMap = isOffline ? "—" : (server.map ?? "—");
  const playersText = isOffline
    ? "—"
    : `${server.numplayers ?? 0} / ${server.maxplayers ?? 0}`;
  const connectText =
    isOffline && server.host != null
      ? `${server.host}${server.port != null ? `:${server.port}` : ""}`
      : server.connect ?? "—";

  const content = (
    <div
      className="relative min-h-[180px] overflow-hidden rounded-xl border border-stone-600/50 bg-stone-900/80 shadow-lg backdrop-blur-sm"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-stone-900/80" aria-hidden />
      <div className="relative flex min-h-[180px] flex-col justify-end p-4 text-left">
        <h3 className="font-display text-lg font-semibold text-white">
          {displayName}
        </h3>
        <p className="text-sm text-neutral-300">
          {displayMap} · {playersText}
        </p>
        {connectText !== "—" && (
          <p className="mt-1 text-xs text-neutral-400">{connectText}</p>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className="w-full cursor-pointer text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:ring-offset-stone-950 rounded-xl"
        onClick={() => onSelect(server)}
      >
        {content}
      </button>
    );
  }

  return content;
}

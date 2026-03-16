/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCopy, faMap, faPlay, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  gamemode?: string;
}

export interface ServerCardProps {
  server: ServerCardServer;
  onSelect?: (server: ServerCardServer) => void;
}

function getMapBadge(mapName: string): { label: string; className: string } {
  if (mapName.startsWith("surf_"))
    return { label: "SURF", className: "bg-sky-500/90 text-white" };
  if (mapName.startsWith("am_"))
    return { label: "ARENA", className: "bg-red-500/90 text-white" };
  if (mapName.startsWith("de_"))
    return { label: "DE", className: "bg-slate-500/90 text-white" };
  return { label: "CS2", className: "bg-stone-500/90 text-white" };
}

export function ServerCard({ server, onSelect }: ServerCardProps) {
  const isOffline = "offline" in server && server.offline === true;
  const mapName = server.map ?? "";
  const bgUrl = getMapThumbnailUrl(mapName);
  const displayName = isOffline ? "Offline" : (server.name ?? "Unknown server");
  const displayMap = isOffline ? "—" : (server.map ?? "—");
  const numPlayers = server.numplayers ?? 0;
  const maxPlayers = Math.max(server.maxplayers ?? 0, 1);
  const playersText = isOffline
    ? "—"
    : `${numPlayers} / ${server.maxplayers ?? 0}`;
  const connectText =
    isOffline && server.host != null
      ? `${server.host}${server.port != null ? `:${server.port}` : ""}`
      : server.connect ?? "";
  const progressPercent = isOffline ? 0 : (numPlayers / maxPlayers) * 100;
  const badge = server.gamemode
    ? { label: server.gamemode.toUpperCase(), className: "bg-sky-500/90 text-white" }
    : getMapBadge(mapName);

  const handleCopyIp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectText) void navigator.clipboard.writeText(connectText);
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectText) window.location.href = `steam://connect/${connectText}`;
  };

  const content = (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-stone-600/40 bg-stone-900 shadow-xl">
      {/* Image header with overlays */}
      <div
        className="relative h-28 shrink-0 bg-stone-800 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
        <div className="absolute left-2 top-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded bg-black/40 px-2 py-1 text-xs font-medium text-white">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-stone-500" : "bg-emerald-400"}`}
          />
          {isOffline ? "Çevrimdışı" : "Çevrimiçi"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display truncate text-base font-bold text-white">
          {displayName}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm text-neutral-300">
            <FontAwesomeIcon icon={faMap} className="h-3.5 w-3.5 text-neutral-500" />
            <span className="truncate">{displayMap}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-white">
            <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5 text-neutral-400" />
            {playersText}
          </span>
        </div>
        {!isOffline && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleCopyIp}
            disabled={!connectText}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-600/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-500 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
            IP Kopyala
          </button>
          <button
            type="button"
            onClick={handleConnect}
            disabled={!connectText}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlay} className="h-4 w-4" />
            Bağlan
          </button>
        </div>
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className="w-full cursor-pointer text-left transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:ring-offset-stone-950 rounded-2xl"
        onClick={() => onSelect(server)}
      >
        {content}
      </button>
    );
  }

  return content;
}

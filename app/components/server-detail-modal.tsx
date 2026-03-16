/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faCopy,
  faMap,
  faPlay,
  faSignal,
  faUsers,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getMapThumbnailUrl } from "~/data/map-thumbnails";

export interface ServerDetailPlayer {
  name?: string;
  score?: number;
  durationSeconds?: number;
  team?: "CT" | "T";
}

export interface ServerDetailServerInfo {
  name?: string;
  map?: string;
  numplayers?: number;
  maxplayers?: number;
  ping?: number;
  connect?: string;
  host?: string;
  port?: number;
  gamemode?: string;
  offline?: boolean;
}

function formatDuration(seconds: number | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Takım bilgisi gelmediği için oyuncuları sırayla iki takıma böl: 1. CT, 2. T, 3. CT, 4. T, ... */
function splitPlayersAlternating(
  players: ServerDetailPlayer[]
): { ct: ServerDetailPlayer[]; t: ServerDetailPlayer[] } {
  const ct = players.filter((_, i) => i % 2 === 0);
  const t = players.filter((_, i) => i % 2 === 1);
  return { ct, t };
}

const RETAKE_CT_MAX = 5;
const RETAKE_T_MAX = 4;

/** Retake: skor 0 olanları Spectators'a at; kalanlarda CT max 5, T max 4; fazlası Spectators. */
function splitPlayersRetake(
  players: ServerDetailPlayer[]
): { ct: ServerDetailPlayer[]; t: ServerDetailPlayer[]; spectators: ServerDetailPlayer[] } {
  const spectators = players.filter((p) => (p.score ?? 0) === 0);
  const playing = players.filter((p) => (p.score ?? 0) !== 0);
  const ct = playing.slice(0, RETAKE_CT_MAX);
  const t = playing.slice(RETAKE_CT_MAX, RETAKE_CT_MAX + RETAKE_T_MAX);
  const overflow = playing.slice(RETAKE_CT_MAX + RETAKE_T_MAX);
  return { ct, t, spectators: [...spectators, ...overflow] };
}

function PlayerTable({
  players,
  teamLabel,
  theme
}: {
  players: ServerDetailPlayer[];
  teamLabel: string;
  theme: "ct" | "t" | "spectator";
}) {
  const bgHeader =
    theme === "ct"
      ? "bg-blue-900/90"
      : theme === "t"
        ? "bg-amber-800/90"
        : "bg-stone-700/90";
  const bgRow =
    theme === "ct"
      ? "bg-blue-950/60"
      : theme === "t"
        ? "bg-amber-950/40"
        : "bg-stone-800/60";

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-white/10">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 ${bgHeader} text-white`}
      >
        <span className="font-display text-sm font-semibold">{teamLabel}</span>
        <span className="text-xs text-white/80">
          {players.length} oyuncu
        </span>
      </div>
      <div className={`flex-1 overflow-y-auto ${bgRow}`}>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-black/30 text-white/80">
            <tr>
              <th className="w-10 px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Oyuncu</th>
              <th className="w-16 px-3 py-2 font-medium text-right">
                Skor
              </th>
              <th className="w-20 px-3 py-2 font-medium text-right">Süre</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-white/60"
                >
                  —
                </td>
              </tr>
            ) : (
              players.map((p, i) => (
                <tr
                  key={i}
                  className="border-t border-white/5 text-white"
                >
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {p.name?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.score != null ? p.score : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatDuration(p.durationSeconds)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ServerDetailModal({
  server,
  players,
  connect,
  loading,
  onClose,
  onCopyIp
}: {
  server: ServerDetailServerInfo | null;
  players: ServerDetailPlayer[];
  connect: string;
  loading: boolean;
  onClose: () => void;
  onCopyIp: (ip: string) => void;
}) {
  const mapUrl = server?.map ? getMapThumbnailUrl(server.map) : null;
  const serverName = server?.name ?? "Sunucu";
  const playersText =
    server && !server.offline
      ? `${server.numplayers ?? 0} / ${server.maxplayers ?? 0}`
      : "—";
  const mapName = server?.map ?? "—";
  const pingText =
    server && !server.offline && server.ping != null
      ? `${server.ping} ms`
      : "—";

  const isRetake = server?.gamemode === "retake";
  const { ct: ctPlayers, t: tPlayers, spectators: spectatorPlayers } = isRetake
    ? splitPlayersRetake(players)
    : { ...splitPlayersAlternating(players), spectators: [] as ServerDetailPlayer[] };

  return (
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-neutral-900 text-white shadow-xl">
      {/* Header with background and map thumbnail */}
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm"
          style={
            mapUrl
              ? { backgroundImage: `url(${mapUrl})` }
              : { backgroundColor: "#1c1917" }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-neutral-900" />
        <div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-2">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {mapUrl && (
              <img
                src={mapUrl}
                alt=""
                className="h-20 w-36 shrink-0 rounded-lg border border-white/10 object-cover shadow-lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-display truncate text-xl font-bold text-white">
                {serverName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2.5 py-1 text-xs font-medium text-white ${
                    server?.offline ? "bg-stone-600/80" : "bg-emerald-600/80"
                  }`}
                >
                  {server?.offline ? "Çevrimdışı" : "Çevrimiçi"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Kapat"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex flex-wrap items-center gap-6 px-6 pb-5">
          <span className="flex items-center gap-2 text-sm text-white/90">
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-white/70" />
            {playersText}
          </span>
          <span className="flex items-center gap-2 text-sm text-white/90">
            <FontAwesomeIcon icon={faMap} className="h-4 w-4 text-white/70" />
            {mapName}
          </span>
          <span className="flex items-center gap-2 text-sm text-white/90">
            <FontAwesomeIcon icon={faSignal} className="h-4 w-4 text-white/70" />
            {pingText}
          </span>
        </div>
      </div>

      {/* Oyuncu listesi — CT/T yan yana; retake ise Spectators altta yatay */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 pb-5">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-neutral-400">
            Oyuncular yükleniyor…
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
              <PlayerTable
                players={ctPlayers}
                teamLabel="Counter-Terrorists"
                theme="ct"
              />
              <PlayerTable
                players={tPlayers}
                teamLabel="Terrorists"
                theme="t"
              />
            </div>
            {isRetake && spectatorPlayers.length > 0 && (
              <div className="shrink-0">
                <PlayerTable
                  players={spectatorPlayers}
                  teamLabel="Spectators"
                  theme="spectator"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-stone-600/50 bg-stone-800/80 px-6 py-4">
        <span className="font-mono text-sm text-white/90">{connect}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopyIp(connect)}
            className="flex items-center gap-2 rounded-lg bg-stone-600/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-500/80"
          >
            <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
            IP Kopyala
          </button>
          <a
            href={`steam://connect/${connect}`}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            <FontAwesomeIcon icon={faPlay} className="h-4 w-4" />
            Sunucuya Katıl
          </a>
        </div>
      </div>
    </div>
  );
}

import { Astal, Gtk } from "astal/gtk3";
import Mpris from "gi://AstalMpris";
import { bind, Variable } from "astal";

// Import business logic from Controller
import {
  trackPlayerInteraction,
  setupPlaybackMonitoring,
  getMostRecentPlayer,
  globalUpdateTrigger,
} from "./Controller";

// Utility Functions
function lengthStr(length: number) {
  const hours = Math.floor(length / 3600);
  const min = Math.floor((length % 3600) / 60);
  const sec = Math.floor(length % 60);
  const sec0 = sec < 10 ? "0" : "";
  const min0 = hours > 0 && min < 10 ? "0" : "";

  if (hours > 0) {
    return `${hours}:${min0}${min}:${sec0}${sec}`;
  } else {
    return `${min}:${sec0}${sec}`;
  }
}

// Pure UI Components
export function TrackInfo({ player }: { player: Mpris.Player }) {
  const { START } = Gtk.Align;

  const title = bind(player, "title").as((t) => t || "Unknown Track");
  const artist = bind(player, "artist").as((a) => a || "Unknown Artist");

  const playerIcon = bind(player, "entry").as((e) =>
    Astal.Icon.lookup_icon(e) ? e : "audio-x-generic-symbolic"
  );

  return (
    <box className="track-info" vertical>
      <box className="title-row">
        <label
          className="track-title"
          halign={START}
          hexpand
          label={title}
          truncate={false}
          ellipsize={3} // PANGO_ELLIPSIZE_END
        />
        <box className="player-indicator">
          <icon icon={playerIcon} />
        </box>
      </box>
      <label
        className="track-artist"
        halign={START}
        label={artist}
        ellipsize={3} // PANGO_ELLIPSIZE_END
      />
    </box>
  );
}

export function ProgressWithTime({
  player,
  trackPlayerInteraction,
}: {
  player: Mpris.Player;
  trackPlayerInteraction: (player: Mpris.Player) => void;
}) {
  // UI state
  const position = Variable(0); // 0-1 range
  const currentTime = Variable(0); // actual seconds

  let isUserInteracting = false;
  let positionHandler: number | null = null;
  let statusHandler: number | null = null;
  let lastKnownPosition = 0;

  // Connect to player notifications
  function connectToPlayer() {
    if (positionHandler) return; // Already connected

    positionHandler = player.connect("notify::position", () => {
      if (
        !isUserInteracting &&
        player.playbackStatus === Mpris.PlaybackStatus.PLAYING &&
        player.length > 0
      ) {
        const playerPos = player.position / player.length;
        position.set(playerPos);
        currentTime.set(player.position);
        lastKnownPosition = player.position;
      }
    });

    statusHandler = player.connect("notify::playback-status", () => {
      if (!isUserInteracting && player.length > 0) {
        const playerPos = player.position / player.length;
        position.set(playerPos);
        currentTime.set(player.position);
        lastKnownPosition = player.position;
      }
    });
  }

  // Disconnect from player notifications
  function disconnectFromPlayer() {
    if (positionHandler) {
      player.disconnect(positionHandler);
      positionHandler = null;
    }
    if (statusHandler) {
      player.disconnect(statusHandler);
      statusHandler = null;
    }
  }

  // Initialize
  if (player.length > 0) {
    const playerPos = player.position / player.length;
    position.set(playerPos);
    currentTime.set(player.position);
    lastKnownPosition = player.position;
  }
  connectToPlayer();
  return (
    <box className="progress-with-time" spacing={8} halign={Gtk.Align.FILL} hexpand>
      <label
        className="current-time"
        visible={bind(player, "length").as((l) => l > 0)}
        label={bind(currentTime).as(lengthStr)}
        halign={Gtk.Align.END}
      />
      <slider
        hexpand
        visible={bind(player, "length").as((l) => l > 0)}
        value={bind(position)}
        onButtonPressEvent={() => {
          isUserInteracting = true;
          disconnectFromPlayer(); // Completely stop listening to player
          return false;
        }}
        onDragged={({ value }) => {
          // User dragging - only update local UI
          position.set(value);
          currentTime.set(value * player.length);
        }}
        onButtonReleaseEvent={() => {
          // Get the target seek time and seek immediately
          const seekTime = position.get() * player.length;
          player.position = seekTime;
          trackPlayerInteraction(player);

          // Keep the UI locked at user position until seek completes
          // Don't reconnect to player notifications immediately
          setTimeout(() => {
            isUserInteracting = false;
            connectToPlayer();
          }, 800); // Give enough time for seek to complete

          return false;
        }}
      />
      <label
        className="total-time"
        visible={bind(player, "length").as((l) => l > 0)}
        label={bind(player, "length").as((l) =>
          l > 0 ? lengthStr(l) : "0:00"
        )}
        halign={Gtk.Align.START}
        ellipsize={0} // PANGO_ELLIPSIZE_NONE - don't ellipsize time
        maxWidthChars={5} // Max chars for "99:99"
      />
    </box>
  );
}

export function MediaControls({
  player,
  trackPlayerInteraction,
}: {
  player: Mpris.Player;
  trackPlayerInteraction: (player: Mpris.Player) => void;
}) {
  const playIcon = bind(player, "playbackStatus").as((s) =>
    s === Mpris.PlaybackStatus.PLAYING
      ? "media-playback-pause-symbolic"
      : "media-playback-start-symbolic"
  );

  return (
    <box className="controls" halign={Gtk.Align.CENTER} hexpand spacing={12}>
      <button
        className="control-btn prev-btn"
        halign={Gtk.Align.START}
        onClicked={() => {
          player.previous();
          trackPlayerInteraction(player);
        }}
        visible={bind(player, "canGoPrevious")}
      >
        <icon icon="media-skip-backward-symbolic" />
      </button>
      <button
        className="control-btn play-btn"
        halign={Gtk.Align.CENTER}
        onClicked={() => {
          player.play_pause();
          trackPlayerInteraction(player);
        }}
        visible={bind(player, "canControl")}
      >
        <icon icon={playIcon} />
      </button>
      <button
        className="control-btn next-btn"
        halign={Gtk.Align.END}
        onClicked={() => {
          player.next();
          trackPlayerInteraction(player);
        }}
        visible={bind(player, "canGoNext")}
      >
        <icon icon="media-skip-forward-symbolic" />
      </button>
    </box>
  );
}

// MediaPlayer component (built from pure UI functions)
function MediaPlayer({ player }: { player: Mpris.Player }) {
  const coverArtBackground = bind(player, "coverArt").as((c) => 
    c ? `background-image: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.7)), url('${c}'); background-size: cover; background-position: center;` : ""
  );

  return (
    <box 
      className="MediaPlayer" 
      heightRequest={100} 
      spacing={6}
      css={coverArtBackground} 
    >
      <box className="media-content" vertical hexpand spacing={6}>
        <TrackInfo player={player} />
        <ProgressWithTime
          player={player}
          trackPlayerInteraction={trackPlayerInteraction}
        />
        <MediaControls
          player={player}
          trackPlayerInteraction={trackPlayerInteraction}
        />
      </box>
    </box>
  );
}

// Single Source Media Player with Most Recent Active Pattern
export default function MediaPlayerComponent() {
  const mpris = Mpris.get_default();

  // Use the global update trigger from interactions
  function triggerUpdate() {
    globalUpdateTrigger.set(globalUpdateTrigger.get() + 1);
    console.log("[MediaPlayer] UI update triggered by player list change");
  }

  // Set up monitoring for player list changes (add/remove players)
  mpris.connect("notify::players", () => {
    triggerUpdate();
    // Set up playback monitoring for new players
    setupPlaybackMonitoring(mpris.players);
  });

  // Initial setup
  setupPlaybackMonitoring(mpris.players);

  return bind(globalUpdateTrigger).as(() => {
    const players = mpris.players;

    if (players.length === 0) {
      return null;
    }

    const activePlayer = getMostRecentPlayer(players);
    if (!activePlayer) {
      return null;
    }

    return (
      <box vertical className="MediaPlayerContainer">
        <MediaPlayer player={activePlayer} />
      </box>
    );
  }) as unknown as Gtk.Widget;
}

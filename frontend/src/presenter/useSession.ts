import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck } from "./types/slides";
import type { SessionCommand, SessionState } from "./types/session";

/**
 * Derived from the page URL for the same reason api.ts is: the phone loads
 * this app over the LAN, where "localhost" would point at the phone itself.
 */
function socketUrl(): string {
  const base =
    import.meta.env.VITE_API_BASE_URL ??
    `${window.location.protocol}//${window.location.hostname}:8000`;
  return `${base.replace(/^http/, "ws")}/api/presenter/session`;
}

const RECONNECT_DELAY_MS = 1500;

/**
 * Connects to the live session and keeps a local copy of its state.
 *
 * Every client — control window, projector, phone — uses this. None of them
 * decides anything: they send commands and render whatever comes back. That's
 * what makes it impossible for two of them to disagree about the current slide.
 *
 * Reconnects automatically, because a dropped socket in the middle of a
 * service must not need a human to notice and fix it.
 */
export function useSession() {
  const [state, setState] = useState<SessionState | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const deckRevisionRef = useRef(-1);
  const closedByUsRef = useRef(false);

  const send = useCallback((command: SessionCommand) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(command));
    }
  }, []);

  useEffect(() => {
    let reconnectTimer: number | undefined;

    const connect = () => {
      const socket = new WebSocket(socketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setError("");
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string);

        if (message.type === "deck") {
          deckRevisionRef.current = message.deck_revision;
          setDeck(message.deck as Deck | null);
          return;
        }

        if (message.type === "state") {
          const next = message as SessionState;
          setState(next);
          // Our cached deck is stale — ask for the current one.
          if (next.deck_revision !== deckRevisionRef.current) {
            socket.send(JSON.stringify({ type: "get_deck" }));
          }
          return;
        }

        if (message.type === "error") {
          setError(String(message.detail));
        }
      };

      socket.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (!closedByUsRef.current) {
          reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      socket.onerror = () => setConnected(false);
    };

    closedByUsRef.current = false;
    connect();

    return () => {
      closedByUsRef.current = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const currentSlide =
    deck && state?.current_slide_id
      ? deck.slides.find((s) => s.id === state.current_slide_id) ?? null
      : null;

  const nextSlide =
    deck && state && state.index >= 0 && state.index + 1 < deck.slides.length
      ? deck.slides[state.index + 1]
      : null;

  return {
    state,
    deck,
    currentSlide,
    nextSlide,
    connected,
    error,
    send,
    clearError: () => setError(""),
  };
}
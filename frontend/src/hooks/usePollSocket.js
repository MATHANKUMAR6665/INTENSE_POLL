import { useState, useEffect, useRef, useCallback } from 'react';

export function usePollSocket(pollId, onReaction, onVoteCast) {
  const [liveState, setLiveState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeViewers, setActiveViewers] = useState(1);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Store onReaction and onVoteCast callbacks in refs to prevent reconnect loops on re-render
  const onReactionRef = useRef(onReaction);
  useEffect(() => {
    onReactionRef.current = onReaction;
  }, [onReaction]);

  const onVoteCastRef = useRef(onVoteCast);
  useEffect(() => {
    onVoteCastRef.current = onVoteCast;
  }, [onVoteCast]);

  const connect = useCallback(() => {
    if (!pollId || !isMountedRef.current) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = window.location.port;
    const isProxied = port === '5173' || port === '3000' || port === '80' || port === '443' || port === '';
    const defaultWsHost = isProxied
      ? `${wsProtocol}//${window.location.host}`
      : `${wsProtocol}//${window.location.hostname}:8080`;
    const wsHost = import.meta.env.VITE_WS_URL || defaultWsHost;
    const socketUrl = `${wsHost}/ws/polls/${pollId}`;

    try {
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) {
          setConnected(true);
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        const raw = typeof event.data === 'string' ? event.data : '';
        const lines = raw.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.type === 'init_state') {
              setLiveState(data.payload);
              if (data.payload.active_viewers) {
                setActiveViewers(data.payload.active_viewers);
              }
            } else if (data.type === 'vote_cast') {
              const voterName = data.payload.voter_name;
              setLiveState((prev) => {
                const prevRecent = prev?.recent_voters || [];
                const updatedRecent = voterName
                  ? [voterName, ...prevRecent.filter((n, idx) => idx < 9 && n !== voterName)]
                  : prevRecent;

                if (!prev) return { ...data.payload, recent_voters: updatedRecent };
                return {
                  ...prev,
                  total_votes: data.payload.total_votes,
                  option_counts: data.payload.option_counts || prev.option_counts,
                  coordinates: data.payload.coordinates || prev.coordinates,
                  recent_voters: updatedRecent,
                };
              });
              if (onVoteCastRef.current) {
                onVoteCastRef.current(data.payload);
              }
            } else if (data.type === 'presence') {
              setActiveViewers(data.payload.active_viewers);
            } else if (data.type === 'reaction') {
              if (onReactionRef.current) {
                onReactionRef.current(data.payload.emoji);
              }
            } else if (data.type === 'status_change') {
              setLiveState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  ...data.payload,
                };
              });
            }
          } catch (e) {
            console.error('Failed to parse WS message chunk:', e, trimmed);
          }
        }
      };

      ws.onclose = () => {
        if (isMountedRef.current) {
          setConnected(false);
          // Reconnect cleanly after 2 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('WS connection error:', err);
    }
  }, [pollId]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { liveState, setLiveState, connected, activeViewers };
}

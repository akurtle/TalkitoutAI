import { useCallback, useState } from "react";
import { useInterval } from "./useInterval";

/** Time each step stays on screen during autoplay. This is UI pacing, not a measured latency. */
export const STEP_DWELL_MS = 3400;

export interface Playback {
  index: number;
  playing: boolean;
  total: number;
  started: boolean;
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  goTo: (i: number) => void;
  stop: () => void;
}

export function usePlayback(total: number): Playback {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const atEnd = index >= total - 1;

  useInterval(
    () => {
      if (index >= total - 1) setPlaying(false);
      else setIndex(index + 1);
    },
    playing && total > 0 ? STEP_DWELL_MS : null
  );

  const play = useCallback(() => {
    setIndex((i) => (i < 0 || i >= total - 1 ? 0 : i));
    setPlaying(true);
  }, [total]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(true);
  }, []);
  const goTo = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(total - 1, i)));
    },
    [total]
  );
  const stop = useCallback(() => {
    setPlaying(false);
    setIndex(-1);
  }, []);

  return { index, playing, total, started: index >= 0, atEnd, play, pause, toggle, next, prev, restart, goTo, stop };
}

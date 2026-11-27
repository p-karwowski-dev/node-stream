import { useEffect, useState } from "react";
import { countdownRemainingSeconds } from "../../state/index.js";
import type { MatchView } from "../../state/index.js";
export interface CountdownOverlayProps {
  readonly match: MatchView;
}
const refreshIntervalMs = 100;
export function CountdownOverlay({ match }: CountdownOverlayProps) {
  const [now, setNow] = useState(() => performance.now());
  const counting = match.countdownEndsAt !== null;
  useEffect(() => {
    if (!counting) {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(performance.now()), refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [counting]);
  const remaining = countdownRemainingSeconds(match, now);
  return remaining === null ? null : <div className="countdown">Starting in {remaining}</div>;
}

import { useEffect, useState } from "react";
import type { Notice } from "../state/index.js";
export interface MessageBarProps {
  readonly notice: Notice | null;
}
const noticeVisibleMs = 5000;
export function MessageBar({ notice }: MessageBarProps) {
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  useEffect(() => {
    if (notice === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setHiddenId(notice.id), noticeVisibleMs);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const text = notice !== null && notice.id !== hiddenId ? notice.text : "";
  return (
    <div className="message-bar" role="status">
      {text}
    </div>
  );
}

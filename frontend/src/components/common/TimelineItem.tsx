import type { ReactNode } from "react";
import { formatDateTime } from "../../utils/format";

export function TimelineItem({ time, title, children }: { time?: string | null; title: string; children?: ReactNode }) {
  return (
    <div className="timeline-item">
      <span className="timeline-dot" />
      <strong>{title}</strong>
      <div className="page-subtitle">{formatDateTime(time)}</div>
      {children ? <div style={{ marginTop: 6 }}>{children}</div> : null}
    </div>
  );
}


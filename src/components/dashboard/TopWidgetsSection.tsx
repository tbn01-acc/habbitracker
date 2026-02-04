import { PomodoroWidgetCompact } from './PomodoroWidgetCompact';
import { TimeStatsWidgetCompact } from './TimeStatsWidgetCompact';

export function TopWidgetsSection() {
  return (
    <div className="grid grid-cols-2 gap-3 items-start">
      <PomodoroWidgetCompact />
      <TimeStatsWidgetCompact />
    </div>
  );
}

import { useMemo } from 'react';
import { DEFAULT_TRADES } from '@/data/trades';
import type { EstimateTrade } from '@/types/estimate';

// US Federal holidays
const getHolidays = (year: number): Set<string> => {
  const holidays = new Set<string>();
  holidays.add(`${year}-01-01`); // New Year
  holidays.add(`${year}-07-04`); // July 4th
  holidays.add(`${year}-12-25`); // Christmas

  // Memorial Day - last Monday in May
  for (let d = 31; d >= 25; d--) {
    const dt = new Date(year, 4, d);
    if (dt.getDay() === 1) { holidays.add(dt.toISOString().split('T')[0]); break; }
  }
  // Labor Day - first Monday in Sep
  for (let d = 1; d <= 7; d++) {
    const dt = new Date(year, 8, d);
    if (dt.getDay() === 1) { holidays.add(dt.toISOString().split('T')[0]); break; }
  }
  // Thanksgiving - 4th Thursday in Nov
  let count = 0;
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(year, 10, d);
    if (dt.getDay() === 4) {
      count++;
      if (count === 4) { holidays.add(dt.toISOString().split('T')[0]); break; }
    }
  }
  return holidays;
};

const addWorkDays = (start: Date, days: number): Date => {
  if (days <= 0) return new Date(start);
  const holidays = new Set([
    ...getHolidays(start.getFullYear()),
    ...getHolidays(start.getFullYear() + 1),
  ]);
  let current = new Date(start);
  let added = 0;
  while (added < days) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    if (day !== 0 && day !== 6 && !holidays.has(dateStr)) {
      added++;
    }
  }
  return current;
};

interface ScheduleTask {
  tradeId: string;
  tradeName: string;
  tradeGroup: string;
  sortOrder: number;
  duration: number;
  startDate: Date;
  endDate: Date;
  inspectionRequired: boolean;
  inspectionType: string;
  predecessorSort: number | null;
  color: string;
  swimLane: number;
}

const getTradeColor = (sortOrder: number): string => {
  if (sortOrder <= 8) return 'bg-warning/60'; // Foundation/Structural - amber
  if (sortOrder >= 11 && sortOrder <= 13) return 'bg-info/60'; // MEP Rough - blue
  if (sortOrder >= 27 && sortOrder <= 29) return 'bg-info/40'; // MEP Finish - blue lighter
  if ([14, 15, 17, 19, 20, 21, 22, 23, 25].includes(sortOrder)) return 'bg-success/50'; // Interior - green
  if ([10, 16, 18, 24, 26, 32, 35].includes(sortOrder)) return 'bg-[hsl(180_60%_35%/0.6)]'; // Exterior - teal
  return 'bg-muted';
};

interface ScheduleGanttProps {
  trades: EstimateTrade[];
  projectStartDate: string;
}

const ScheduleGantt = ({ trades, projectStartDate }: ScheduleGanttProps) => {
  const activeTrades = trades.filter(t => t.isActive && t.scheduleDurationDays > 0);

  const schedule = useMemo(() => {
    if (!projectStartDate || activeTrades.length === 0) return [];

    const startDate = new Date(projectStartDate + 'T00:00:00');
    const tradeDefMap = new Map(DEFAULT_TRADES.map(t => [t.sortOrder, t]));
    const tasks: ScheduleTask[] = [];
    const completedTasks = new Map<number, Date>(); // sortOrder -> endDate

    // Sort active trades by sortOrder
    const sorted = [...activeTrades].sort((a, b) => a.sortOrder - b.sortOrder);

    for (const trade of sorted) {
      const def = tradeDefMap.get(trade.sortOrder);
      if (!def) continue;

      let taskStart: Date;

      if (!def.predecessorSort) {
        taskStart = new Date(startDate);
      } else {
        const predEnd = completedTasks.get(def.predecessorSort);
        if (predEnd) {
          if (def.relationshipType === 'FS') {
            taskStart = addWorkDays(predEnd, def.lagDays);
          } else if (def.relationshipType === 'SS') {
            // Start-to-Start: find predecessor start
            const predTask = tasks.find(t => t.sortOrder === def.predecessorSort);
            taskStart = predTask ? new Date(predTask.startDate) : addWorkDays(predEnd, 0);
          } else {
            taskStart = addWorkDays(predEnd, def.lagDays);
          }
        } else {
          taskStart = new Date(startDate);
        }
      }

      const duration = trade.scheduleDurationDays;
      const endDate = addWorkDays(taskStart, duration);

      // Determine swim lane (avoid overlaps)
      let lane = 0;
      for (const existing of tasks) {
        if (existing.startDate <= endDate && existing.endDate >= taskStart && existing.swimLane === lane) {
          lane++;
        }
      }

      tasks.push({
        tradeId: trade.id,
        tradeName: trade.tradeName,
        tradeGroup: trade.tradeGroup,
        sortOrder: trade.sortOrder,
        duration,
        startDate: taskStart,
        endDate,
        inspectionRequired: trade.inspectionRequired,
        inspectionType: trade.inspectionType,
        predecessorSort: def.predecessorSort,
        color: getTradeColor(trade.sortOrder),
        swimLane: lane,
      });

      completedTasks.set(trade.sortOrder, endDate);
    }

    return tasks;
  }, [activeTrades, projectStartDate]);

  if (!projectStartDate) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground font-mono text-sm">Set a project start date to generate the schedule</p>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground font-mono text-sm">Activate trades with durations to build the schedule</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const minDate = new Date(Math.min(...schedule.map(t => t.startDate.getTime())));
  const maxDate = new Date(Math.max(...schedule.map(t => t.endDate.getTime())));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const maxLane = Math.max(...schedule.map(t => t.swimLane));
  const dayWidth = Math.max(20, Math.min(40, 800 / totalDays));

  // Generate week markers
  const weeks: { date: Date; label: string; x: number }[] = [];
  const current = new Date(minDate);
  while (current <= maxDate) {
    if (current.getDay() === 1) {
      const x = Math.ceil((current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;
      weeks.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const projectEndDate = maxDate;
  const projectDuration = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Schedule Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Start</span>
            <span className="font-mono text-sm text-foreground">{formatDate(minDate)}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">End</span>
            <span className="font-mono text-sm text-primary">{formatDate(projectEndDate)}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Duration</span>
            <span className="font-mono text-sm text-foreground">{projectDuration} calendar days</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Active Trades</span>
            <span className="font-mono text-sm text-foreground">{schedule.length}</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/60" /> Structural</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-info/60" /> MEP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/50" /> Interior</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[hsl(180_60%_35%/0.6)]" /> Exterior</span>
        </div>
      </div>

      {/* Gantt Body */}
      <div className="flex overflow-x-auto">
        {/* Trade Names Column */}
        <div className="flex-shrink-0 w-48 border-r border-border">
          {schedule.map((task) => (
            <div
              key={task.tradeId}
              className="flex items-center gap-2 px-3 h-10 border-b border-border/30 text-xs"
            >
              <span className="font-mono text-[10px] text-muted-foreground">{String(task.sortOrder).padStart(2, '0')}</span>
              <span className="font-heading text-xs font-semibold truncate">{task.tradeName}</span>
              {task.inspectionRequired && (
                <span className="text-[7px] text-warning font-bold">◆</span>
              )}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 overflow-x-auto relative" style={{ minWidth: totalDays * dayWidth }}>
          {/* Week Headers */}
          <div className="flex h-6 border-b border-border bg-secondary/10 sticky top-0">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="absolute text-[8px] font-mono text-muted-foreground uppercase"
                style={{ left: w.x }}
              >
                {w.label}
              </div>
            ))}
          </div>

          {/* Bars */}
          {schedule.map((task) => {
            const startOffset = Math.ceil((task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const width = Math.max(task.duration * dayWidth, dayWidth);

            return (
              <div key={task.tradeId} className="relative h-10 border-b border-border/20">
                <div
                  className={`absolute top-1.5 h-7 rounded ${task.color} flex items-center px-2 text-[9px] font-mono font-bold text-foreground shadow-sm border border-border/20 cursor-default group`}
                  style={{
                    left: startOffset * dayWidth,
                    width,
                    minWidth: 60,
                  }}
                  title={`${task.tradeName}: ${formatDate(task.startDate)} — ${formatDate(task.endDate)} (${task.duration}d)`}
                >
                  <span className="truncate">{task.duration}d</span>
                  {task.inspectionRequired && (
                    <span className="ml-1 text-warning">◆</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGantt;

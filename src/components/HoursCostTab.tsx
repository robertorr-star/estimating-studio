import { useState, useEffect } from 'react';
import { Clock, DollarSign, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSessions, fetchEstimatorRates } from '@/services/timeTrackingService';

interface HoursCostTabProps {
  estimateId: string | null;
  estimateNumber: string;
  projectName: string;
  status: string;
  contractValue: number;
}

const HoursCostTab = ({ estimateId, estimateNumber, projectName, status, contractValue }: HoursCostTabProps) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if (!estimateId) return;
    const load = async () => {
      const [s, r] = await Promise.all([fetchSessions(estimateId), fetchEstimatorRates()]);
      setSessions(s);
      setRates(r);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [estimateId]);

  const rateMap: Record<string, number> = {};
  rates.forEach(r => { rateMap[r.estimator_name] = Number(r.hourly_rate); });

  const nonIdleSessions = sessions.filter(s => s.activity_type !== 'idle');
  const hoursByUser: Record<string, number> = {};
  nonIdleSessions.forEach(s => {
    const mins = Number(s.duration_minutes) || 0;
    hoursByUser[s.user_name] = (hoursByUser[s.user_name] || 0) + mins / 60;
  });

  const estimators = ['Sigfried', 'Joseph', 'Robert'];
  const rows = estimators.map(name => ({
    name,
    hours: hoursByUser[name] || 0,
    rate: rateMap[name] || 0,
    cost: (hoursByUser[name] || 0) * (rateMap[name] || 0),
  }));
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const isWon = status === 'signed' || status === 'converted_to_project';
  const returnVal = isWon && totalCost > 0 ? contractValue / totalCost : null;

  // Activity breakdown
  const activityTypes = ['takeoff_entry', 'material_library', 'schedule', 'proposal', 'review', 'approval_flow'];
  const activityLabels: Record<string, string> = {
    takeoff_entry: 'Takeoff Entry', material_library: 'Material Library',
    schedule: 'Schedule Work', proposal: 'Proposal/Review', review: 'Review', approval_flow: 'Approval Flow',
  };
  const hoursByActivity: Record<string, number> = {};
  nonIdleSessions.forEach(s => {
    const mins = Number(s.duration_minutes) || 0;
    hoursByActivity[s.activity_type] = (hoursByActivity[s.activity_type] || 0) + mins / 60;
  });

  // Active sessions (no session_end)
  const activeSessions = sessions.filter(s => !s.session_end);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
  const fmtH = (h: number) => `${h.toFixed(1)}h`;

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      {activeSessions.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono">
            {activeSessions.map(s => {
              const elapsed = Math.round((Date.now() - new Date(s.session_start).getTime()) / 60000);
              const h = Math.floor(elapsed / 60);
              const m = elapsed % 60;
              return `${s.user_name} is working — session active (${h}h ${m}m)`;
            }).join(' | ')}
          </span>
        </div>
      )}

      {/* Time Card */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-bold tracking-wider uppercase">
            Estimating Cost — {estimateNumber}
          </span>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left py-2">Estimator</th>
                <th className="text-right py-2">Hours</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} className="border-b border-border/50">
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2 text-right font-mono">{fmtH(r.hours)}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">${r.rate}/hr</td>
                  <td className="py-2 text-right font-mono">{fmt(r.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t border-border">
                <td className="py-2">TOTAL</td>
                <td className="py-2 text-right font-mono">{fmtH(totalHours)}</td>
                <td className="py-2" />
                <td className="py-2 text-right font-mono text-primary">{fmt(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Return */}
        {isWon && (
          <div className="px-4 pb-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contract Value:</span>
              <span className="font-mono font-bold">{fmt(contractValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimate Cost:</span>
              <span className="font-mono">{fmt(totalCost)}</span>
            </div>
            {returnVal && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Return:</span>
                <span className="font-mono font-bold text-primary">{Math.round(returnVal)}×</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground italic mt-1">
              Every $1 spent estimating returned ${returnVal ? Math.round(returnVal) : '—'}
            </p>
          </div>
        )}

        <div className="px-4 pb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded ${
            isWon ? 'bg-green-500/15 text-green-400' :
            status === 'rejected' ? 'bg-red-500/15 text-red-400' :
            'bg-yellow-500/15 text-yellow-400'
          }`}>
            {isWon ? '🟢 WON' : status === 'rejected' ? '🔴 LOST' : '⏳ PENDING'}
          </span>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="rounded-lg border border-border bg-card">
        <button onClick={() => setShowActivity(!showActivity)}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <span className="font-heading text-sm font-bold tracking-wider uppercase flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Activity Breakdown
          </span>
          {showActivity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showActivity && (
          <div className="px-4 pb-4 space-y-2">
            {activityTypes.map(type => {
              const h = hoursByActivity[type] || 0;
              const pct = totalHours > 0 ? (h / totalHours) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-muted-foreground">{activityLabels[type]}</span>
                  <div className="flex-1 bg-secondary/30 rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono w-16 text-right">{fmtH(h)} ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Log */}
      <div className="rounded-lg border border-border bg-card">
        <button onClick={() => setShowSessions(!showSessions)}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
          <span className="font-heading text-sm font-bold tracking-wider uppercase flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Session Log
          </span>
          {showSessions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSessions && (
          <div className="px-4 pb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left py-1.5">Date</th>
                  <th className="text-left py-1.5">User</th>
                  <th className="text-right py-1.5">Duration</th>
                  <th className="text-left py-1.5 pl-3">Activity</th>
                  <th className="text-center py-1.5">Active?</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map(s => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="py-1.5 font-mono">{new Date(s.session_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="py-1.5">{s.user_name}</td>
                    <td className="py-1.5 text-right font-mono">{fmtH((Number(s.duration_minutes) || 0) / 60)}</td>
                    <td className="py-1.5 pl-3">{activityLabels[s.activity_type] || s.activity_type}</td>
                    <td className="py-1.5 text-center">{s.activity_type !== 'idle' ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoursCostTab;

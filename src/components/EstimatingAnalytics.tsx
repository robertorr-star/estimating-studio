import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Clock, TrendingUp, Users, AlertTriangle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAllCostSummaries, fetchAllSessions, fetchEstimatorRates } from '@/services/timeTrackingService';
import { fetchEstimates } from '@/services/estimateService';

const EstimatingAnalytics = () => {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, sess, r, ests] = await Promise.all([
        fetchAllCostSummaries(), fetchAllSessions(), fetchEstimatorRates(), fetchEstimates(),
      ]);
      setSummaries(s);
      setSessions(sess);
      setRates(r);
      setEstimates(ests);
    };
    load();
  }, []);

  const rateMap: Record<string, number> = {};
  rates.forEach(r => { rateMap[r.estimator_name] = Number(r.hourly_rate); });

  const totalEstimates = summaries.length;
  const avgHours = totalEstimates > 0 ? summaries.reduce((s, e) => s + Number(e.total_hours_all || 0), 0) / totalEstimates : 0;
  const avgCost = totalEstimates > 0 ? summaries.reduce((s, e) => s + Number(e.total_estimate_cost || 0), 0) / totalEstimates : 0;
  const totalCostYTD = summaries.reduce((s, e) => s + Number(e.total_estimate_cost || 0), 0);
  const wonEstimates = summaries.filter(e => e.won);
  const lostEstimates = summaries.filter(e => e.estimate_status === 'rejected');
  const avgReturnWon = wonEstimates.length > 0
    ? wonEstimates.reduce((s, e) => s + (Number(e.return_on_estimate) || 0), 0) / wonEstimates.length : 0;
  const lostCost = lostEstimates.reduce((s, e) => s + Number(e.total_estimate_cost || 0), 0);

  // Activity breakdown
  const nonIdleSessions = sessions.filter(s => s.activity_type !== 'idle');
  const totalSessionHours = nonIdleSessions.reduce((s, sess) => s + (Number(sess.duration_minutes) || 0) / 60, 0);
  const activityTypes = ['takeoff_entry', 'material_library', 'schedule', 'proposal', 'review', 'approval_flow'];
  const activityLabels: Record<string, string> = {
    takeoff_entry: 'Takeoff Entry', material_library: 'Material Library',
    schedule: 'Schedule', proposal: 'Proposal/Review', review: 'Review', approval_flow: 'Approval Flow',
  };
  const hoursByActivity: Record<string, number> = {};
  nonIdleSessions.forEach(s => {
    hoursByActivity[s.activity_type] = (hoursByActivity[s.activity_type] || 0) + (Number(s.duration_minutes) || 0) / 60;
  });

  // Estimator efficiency
  const estimatorStats = ['Sigfried', 'Joseph', 'Jess', 'Jake'].map(name => {
    const ests = summaries.filter(e => e.estimator_primary === name);
    const won = ests.filter(e => e.won);
    return {
      name,
      count: ests.length,
      avgHours: ests.length > 0 ? ests.reduce((s, e) => s + Number(e.total_hours_all || 0), 0) / ests.length : 0,
      avgCost: ests.length > 0 ? ests.reduce((s, e) => s + Number(e.total_estimate_cost || 0), 0) / ests.length : 0,
      winRate: ests.length > 0 ? (won.length / ests.length) * 100 : 0,
      avgReturn: won.length > 0 ? won.reduce((s, e) => s + (Number(e.return_on_estimate) || 0), 0) / won.length : 0,
    };
  });

  // === ACCOUNTABILITY METRICS ===
  const timeDiffHours = (from?: string | null, to?: string | null) => {
    if (!from || !to) return null;
    return (new Date(to).getTime() - new Date(from).getTime()) / 3600000;
  };

  const approvedEstimates = estimates.filter((e: any) => e.robert_approved_at);

  const sigfriedReviewTimes = approvedEstimates
    .map((e: any) => timeDiffHours(e.built_completed_at, e.sigfried_approved_at))
    .filter((v): v is number => v !== null && v > 0);
  const avgSigfriedReview = sigfriedReviewTimes.length > 0
    ? sigfriedReviewTimes.reduce((a, b) => a + b, 0) / sigfriedReviewTimes.length : 0;

  const leoReviewTimes = approvedEstimates
    .map((e: any) => timeDiffHours(e.sigfried_approved_at, e.leo_approved_at))
    .filter((v): v is number => v !== null && v > 0);
  const avgLeoReview = leoReviewTimes.length > 0
    ? leoReviewTimes.reduce((a, b) => a + b, 0) / leoReviewTimes.length : 0;

  const robertDecisionTimes = approvedEstimates
    .map((e: any) => timeDiffHours(e.leo_approved_at, e.robert_approved_at))
    .filter((v): v is number => v !== null && v > 0);
  const avgRobertDecision = robertDecisionTimes.length > 0
    ? robertDecisionTimes.reduce((a, b) => a + b, 0) / robertDecisionTimes.length : 0;

  const totalCycleTimes = approvedEstimates
    .map((e: any) => timeDiffHours(e.built_completed_at, e.robert_approved_at))
    .filter((v): v is number => v !== null && v > 0);
  const avgCycleTime = totalCycleTimes.length > 0
    ? totalCycleTimes.reduce((a, b) => a + b, 0) / totalCycleTimes.length : 0;

  // Send-backs
  const totalSigfriedSendBacks = estimates.reduce((s: number, e: any) => s + (Number(e.sigfried_send_backs) || 0), 0);
  const totalLeoSendBacks = estimates.reduce((s: number, e: any) => s + (Number(e.leo_send_backs) || 0), 0);
  const totalRobertSendBacks = estimates.reduce((s: number, e: any) => s + (Number(e.robert_send_backs) || 0), 0);

  const formatHours = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}m`;
    return `${h.toFixed(1)}h`;
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold tracking-wider uppercase text-primary flex items-center gap-2">
        <BarChart3 className="h-5 w-5" /> Estimating Efficiency
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Avg Hours / Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground">{avgHours.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground mt-1">
              {['Sigfried', 'Joseph', 'Jess', 'Jake'].map(n => {
                const ests = summaries.filter(e => e.estimator_primary === n);
                const avg = ests.length > 0 ? ests.reduce((s, e) => s + Number(e.total_hours_all || 0), 0) / ests.length : 0;
                return avg > 0 ? `${n} ${avg.toFixed(1)}h` : null;
              }).filter(Boolean).join(' | ')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Avg Cost / Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground">{fmt(avgCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Every estimate costs OCD {fmt(avgCost)} on average
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> YTD Estimate Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground">{fmt(totalCostYTD)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalEstimates} estimates | Lost: {fmt(lostCost)} with 0% return
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Avg Return (Won)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-primary">{Math.round(avgReturnWon)}×</div>
            <div className="text-xs text-muted-foreground mt-1">
              For every $1 spent estimating won jobs, OCD earns ${Math.round(avgReturnWon)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Accountability Metrics */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm tracking-wider uppercase flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" /> Approval Accountability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Sigfried Avg Review</div>
              <div className="text-xl font-mono font-bold text-foreground">{avgSigfriedReview > 0 ? formatHours(avgSigfriedReview) : '—'}</div>
              <div className="text-[9px] font-mono text-muted-foreground">{sigfriedReviewTimes.length} reviews</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Leo Avg Review</div>
              <div className="text-xl font-mono font-bold text-foreground">{avgLeoReview > 0 ? formatHours(avgLeoReview) : '—'}</div>
              <div className="text-[9px] font-mono text-muted-foreground">{leoReviewTimes.length} reviews</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Robert Avg Decision</div>
              <div className="text-xl font-mono font-bold text-foreground">{avgRobertDecision > 0 ? formatHours(avgRobertDecision) : '—'}</div>
              <div className="text-[9px] font-mono text-muted-foreground">{robertDecisionTimes.length} decisions</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Total Cycle Time</div>
              <div className="text-xl font-mono font-bold text-primary">{avgCycleTime > 0 ? formatHours(avgCycleTime) : '—'}</div>
              <div className="text-[9px] font-mono text-muted-foreground">build → approved</div>
            </div>
          </div>

          {/* Send-back quality scores */}
          <div className="border-t border-border/50 pt-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Send-Backs (Quality Score)</div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sigfried:</span>
                <span className={`font-mono font-bold ${totalSigfriedSendBacks > 0 ? 'text-warning' : 'text-success'}`}>{totalSigfriedSendBacks}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Leo:</span>
                <span className={`font-mono font-bold ${totalLeoSendBacks > 0 ? 'text-warning' : 'text-success'}`}>{totalLeoSendBacks}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Robert:</span>
                <span className={`font-mono font-bold ${totalRobertSendBacks > 0 ? 'text-warning' : 'text-success'}`}>{totalRobertSendBacks}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimate Cost vs Return Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm tracking-wider uppercase">
            Estimate Cost vs Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2">Estimate</th>
                  <th className="text-left py-2">Project</th>
                  <th className="text-left py-2">Estimator</th>
                  <th className="text-right py-2">Hours</th>
                  <th className="text-right py-2">Cost</th>
                  <th className="text-right py-2">Contract</th>
                  <th className="text-right py-2">Return</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries.sort((a, b) => Number(b.total_estimate_cost) - Number(a.total_estimate_cost)).map(s => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="py-2 font-mono text-xs">{s.estimate_number}</td>
                    <td className="py-2">{s.project_name}</td>
                    <td className="py-2">{s.estimator_primary}</td>
                    <td className="py-2 text-right font-mono">{Number(s.total_hours_all || 0).toFixed(1)}h</td>
                    <td className="py-2 text-right font-mono">{fmt(Number(s.total_estimate_cost || 0))}</td>
                    <td className="py-2 text-right font-mono">{s.won ? fmt(Number(s.contract_value || 0)) : '—'}</td>
                    <td className="py-2 text-right font-mono font-bold">{s.return_on_estimate ? `${Math.round(Number(s.return_on_estimate))}×` : '0×'}</td>
                    <td className="py-2 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        s.won ? 'bg-success/15 text-success' :
                        s.estimate_status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                        'bg-warning/15 text-warning'
                      }`}>
                        {s.won ? '🟢 WON' : s.estimate_status === 'rejected' ? '🔴 LOST' : '⏳'}
                      </span>
                    </td>
                  </tr>
                ))}
                {summaries.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground italic">No estimate cost data yet — tracking starts automatically</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lost Estimate Analysis */}
      {lostEstimates.length > 0 && (
        <Card className="bg-card border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              OCD spent <span className="font-mono font-bold text-foreground">{fmt(lostCost)}</span> producing estimates that were not won YTD.
              Average hours on lost estimates: <span className="font-mono font-bold">{(lostEstimates.reduce((s, e) => s + Number(e.total_hours_all || 0), 0) / lostEstimates.length).toFixed(1)}h</span> vs{' '}
              <span className="font-mono font-bold">{wonEstimates.length > 0 ? (wonEstimates.reduce((s, e) => s + Number(e.total_hours_all || 0), 0) / wonEstimates.length).toFixed(1) : '0'}h</span> for won.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estimator Efficiency */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm tracking-wider uppercase flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Estimator Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left py-2">Estimator</th>
                <th className="text-right py-2">Estimates</th>
                <th className="text-right py-2">Avg Hours</th>
                <th className="text-right py-2">Avg Cost</th>
                <th className="text-right py-2">Win Rate</th>
                <th className="text-right py-2">Avg Return</th>
              </tr>
            </thead>
            <tbody>
              {estimatorStats.filter(e => e.count > 0).map(e => (
                <tr key={e.name} className="border-b border-border/30">
                  <td className="py-2 font-medium">{e.name}</td>
                  <td className="py-2 text-right font-mono">{e.count}</td>
                  <td className="py-2 text-right font-mono">{e.avgHours.toFixed(1)}h</td>
                  <td className="py-2 text-right font-mono">{fmt(e.avgCost)}</td>
                  <td className="py-2 text-right font-mono">{e.winRate.toFixed(0)}%</td>
                  <td className="py-2 text-right font-mono font-bold text-primary">{Math.round(e.avgReturn)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Hours by Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm tracking-wider uppercase">Hours by Activity (All Estimates)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activityTypes.map(type => {
            const h = hoursByActivity[type] || 0;
            const pct = totalSessionHours > 0 ? (h / totalSessionHours) * 100 : 0;
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs w-32 text-muted-foreground">{activityLabels[type]}</span>
                <div className="flex-1 bg-secondary/30 rounded-full h-2.5">
                  <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono w-20 text-right">{h.toFixed(1)}h ({pct.toFixed(0)}%)</span>
              </div>
            );
          })}
          {totalSessionHours > 0 && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              Estimators spend {((hoursByActivity['takeoff_entry'] || 0) / totalSessionHours * 100).toFixed(0)}% of their time on actual line item entry.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimatingAnalytics;

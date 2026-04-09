import { TrendingUp, DollarSign, Percent, Trophy, Clock, BookCheck } from 'lucide-react';

interface KPIStripProps {
  estimates: any[];
}

const MARGIN_FLOOR = () => {
  const stored = localStorage.getItem('marginFloor');
  return stored ? parseFloat(stored) : 28;
};

const KPIStrip = ({ estimates }: KPIStripProps) => {
  const thisMonth = estimates.filter(e => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalBidValue = estimates.reduce((s, e) => s + e.totalContractPrice, 0);
  const avgMargin = estimates.length
    ? estimates.reduce((s, e) => s + e.grossMarginPct, 0) / estimates.length
    : 0;
  const submitted = estimates.filter(e => e.status !== 'draft').length;
  const signed = estimates.filter(e => e.status === 'signed' || e.status === 'converted_to_project' || e.status === 'active_project').length;
  const winRate = submitted > 0 ? (signed / submitted) * 100 : 0;
  const pending = estimates.filter(e => ['submitted', 'under_review'].includes(e.status)).length;

  const signedBacklog = estimates
    .filter(e => e.status === 'signed' || e.status === 'approved')
    .reduce((s, e) => s + e.totalContractPrice, 0);
  const lowPipeline = signedBacklog < 250000;

  const marginFloor = MARGIN_FLOOR();
  const marginColor = avgMargin >= marginFloor ? 'text-success' : avgMargin >= 25 ? 'text-warning' : 'text-destructive';

  const kpis = [
    { label: 'Estimates This Month', value: thisMonth.length.toString(), icon: TrendingUp, color: 'text-info', pulse: false },
    { label: 'Total Bid Value', value: `$${(totalBidValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-primary', pulse: false },
    { label: 'Average Margin', value: `${avgMargin.toFixed(1)}%`, icon: Percent, color: marginColor, pulse: false },
    { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, icon: Trophy, color: 'text-warning', pulse: false },
    { label: 'Pending Approval', value: pending.toString(), icon: Clock, color: 'text-muted-foreground', pulse: false },
    { label: 'Signed Backlog', value: `$${(signedBacklog / 1000).toFixed(0)}K`, icon: BookCheck, color: 'text-teal-400', pulse: lowPipeline },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className={`rounded-lg border border-border bg-card p-4 ${kpi.pulse ? 'animate-pulse ring-1 ring-warning/50' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${kpi.pulse ? 'text-warning' : kpi.color}`} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-mono font-bold ${kpi.pulse ? 'text-warning' : kpi.color}`}>{kpi.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default KPIStrip;

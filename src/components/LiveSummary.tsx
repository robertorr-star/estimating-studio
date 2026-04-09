import { DollarSign, Percent, Clock, Layers, Calendar, Ruler, CheckCircle, XCircle } from 'lucide-react';
import type { EstimateTrade } from '@/types/estimate';

interface LiveSummaryProps {
  trades: EstimateTrade[];
  totalSqFt: number;
  projectStartDate: string;
}

const MARGIN_FLOOR = () => {
  const stored = localStorage.getItem('marginFloor');
  return stored ? parseFloat(stored) : 28;
};

const LiveSummary = ({ trades, totalSqFt, projectStartDate }: LiveSummaryProps) => {
  const activeTrades = trades.filter(t => t.isActive);
  const totalBuildCost = activeTrades.reduce((s, t) => s + t.totalExtCost, 0);
  const totalProfit = activeTrades.reduce((s, t) => s + t.totalProfit, 0);
  const totalContractPrice = totalBuildCost + totalProfit;
  const grossMargin = totalContractPrice > 0 ? (totalProfit / totalContractPrice) * 100 : 0;
  const costPerSqFt = totalSqFt > 0 ? totalContractPrice / totalSqFt : 0;
  const estDuration = Math.max(...activeTrades.map(t => t.scheduleDurationDays), 0);

  const marginFloor = MARGIN_FLOOR();

  // Margin breakdown allocations
  const overheadAlloc = 18.0;
  const ownerSalaryAlloc = 5.0;
  const netProfitRemaining = grossMargin - overheadAlloc - ownerSalaryAlloc;
  const coversOverhead = grossMargin >= overheadAlloc;
  const coversOwnerSalary = grossMargin >= overheadAlloc + ownerSalaryAlloc;
  const netProfitHealthy = netProfitRemaining >= 5;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const marginColor = grossMargin >= marginFloor ? 'text-success' : grossMargin >= 25 ? 'text-warning' : 'text-destructive';

  const items = [
    { label: 'Contract Price', value: formatCurrency(totalContractPrice), icon: DollarSign, highlight: true },
    { label: 'Build Cost', value: formatCurrency(totalBuildCost), icon: DollarSign },
    { label: 'Total Profit', value: formatCurrency(totalProfit), icon: DollarSign, success: true },
    { label: 'Gross Margin', value: `${grossMargin.toFixed(1)}%`, icon: Percent, customColor: marginColor },
    { label: 'Cost per SF', value: `$${costPerSqFt.toFixed(0)}`, icon: Ruler },
    { label: 'Active Trades', value: `${activeTrades.length} of ${trades.length}`, icon: Layers },
    { label: 'Est. Duration', value: `${estDuration} days`, icon: Clock },
    { label: 'Start Date', value: projectStartDate || '—', icon: Calendar },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 sticky top-4">
      <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-primary mb-4 pb-2 border-b border-border">
        Live Summary
      </h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const color = item.customColor || (item.highlight ? 'text-primary' : item.success ? 'text-success' : 'text-muted-foreground');
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <span className={`font-mono text-sm font-bold ${item.customColor || (item.highlight ? 'text-primary text-base' : item.success ? 'text-success' : 'text-foreground')}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Margin Breakdown */}
      {totalContractPrice > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Margin Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Gross Margin</span>
              <span className={`font-mono text-sm font-bold ${marginColor}`}>{grossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {coversOverhead
                  ? <CheckCircle className="h-3 w-3 text-success" />
                  : <XCircle className="h-3 w-3 text-destructive" />}
                <span className="text-xs text-muted-foreground">Overhead Coverage</span>
              </div>
              <span className="font-mono text-xs">{overheadAlloc.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {coversOwnerSalary
                  ? <CheckCircle className="h-3 w-3 text-success" />
                  : <XCircle className="h-3 w-3 text-destructive" />}
                <span className="text-xs text-muted-foreground">Owner Salary</span>
              </div>
              <span className="font-mono text-xs">{ownerSalaryAlloc.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net Profit Remaining</span>
              <span className={`font-mono text-xs font-bold ${netProfitHealthy ? 'text-success' : 'text-destructive'}`}>
                {netProfitRemaining > 0 ? netProfitRemaining.toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSummary;

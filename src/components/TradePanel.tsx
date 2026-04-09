import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, ToggleLeft, ToggleRight, AlertTriangle, Package } from 'lucide-react';
import type { EstimateTrade, EstimateLineItem } from '@/types/estimate';
import { DEFAULT_PROFIT_MARGINS, UNITS, COST_TYPES, TEAM_RATES } from '@/data/trades';

interface TradePanelProps {
  trade: EstimateTrade;
  onToggle: (tradeId: string) => void;
  onUpdateLineItem: (tradeId: string, itemId: string, field: string, value: any) => void;
  onAddLineItem: (tradeId: string) => void;
  onRemoveLineItem: (tradeId: string, itemId: string) => void;
  onTeamSizeChange: (tradeId: string, size: number) => void;
  onOpenLibrary?: (tradeId: string) => void;
}

const TradePanel = ({ trade, onToggle, onUpdateLineItem, onAddLineItem, onRemoveLineItem, onTeamSizeChange, onOpenLibrary }: TradePanelProps) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className={`rounded-lg border transition-all ${trade.isActive ? 'border-primary/30 bg-card' : 'border-border/50 bg-card/30 opacity-60'}`}>
      {/* Trade Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => trade.isActive && setExpanded(!expanded)}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(trade.id); }}
          className="flex-shrink-0"
        >
          {trade.isActive
            ? <ToggleRight className="h-6 w-6 text-primary" />
            : <ToggleLeft className="h-6 w-6 text-muted-foreground" />
          }
        </button>

        {trade.isActive && (
          expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-xs text-muted-foreground">
            {String(trade.sortOrder).padStart(2, '0')}
          </span>
          <span className={`font-heading text-sm font-semibold tracking-wide uppercase ${trade.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {trade.tradeName}
          </span>
          {trade.inspectionRequired && (
            <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-warning/15 text-warning border border-warning/30 rounded uppercase">
              INSP
            </span>
          )}
        </div>

        {trade.isActive && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">{trade.lineItems.length} items</span>
            <span className="text-primary font-bold">{formatCurrency(trade.totalPrice)}</span>
          </div>
        )}
      </div>

      {/* Expanded Line Items */}
      {trade.isActive && expanded && (
        <div className="border-t border-border/50 px-4 pb-4">
          {/* Team Size Selector */}
          <div className="flex items-center gap-3 py-3 border-b border-border/30 mb-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Crew Size:</span>
            {[1, 2, 3, 4].map(size => (
              <button
                key={size}
                onClick={() => onTeamSizeChange(trade.id, size)}
                className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                  trade.teamSize === size
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-border hover:border-primary/20'
                }`}
              >
                {size}P — ${TEAM_RATES[size]}/hr
              </button>
            ))}
          </div>

          {/* Line Items Header */}
          <div className="grid grid-cols-[1fr_80px_80px_90px_90px_80px_80px_90px_32px] gap-2 mb-2">
            {['Description', 'Qty', 'Unit', 'Unit Cost', 'Ext Cost', 'Type', 'Profit%', 'Total', ''].map(h => (
              <span key={h} className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Line Items */}
          {trade.lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_80px_80px_90px_90px_80px_80px_90px_32px] gap-2 mb-1.5 items-center">
              <input
                value={item.description}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'description', e.target.value)}
                className="bg-secondary/30 border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                placeholder="Description"
              />
              <input
                type="number"
                value={item.quantity || ''}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                className="bg-secondary/30 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:border-primary/50 text-foreground"
                placeholder="0"
              />
              <select
                value={item.unit}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'unit', e.target.value)}
                className="bg-secondary/30 border border-border/50 rounded px-1 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input
                type="number"
                value={item.unitCost || ''}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                className="bg-secondary/30 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-right focus:outline-none focus:border-primary/50 text-foreground"
                placeholder="$0"
              />
              <span className="text-xs font-mono text-primary text-right pr-2">
                {formatCurrency(item.extCost)}
              </span>
              <select
                value={item.costType}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'costType', e.target.value)}
                className="bg-secondary/30 border border-border/50 rounded px-1 py-1.5 text-[10px] focus:outline-none focus:border-primary/50 text-foreground"
              >
                {COST_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
              </select>
              <input
                type="number"
                value={(item.profitPct * 100) || ''}
                onChange={(e) => onUpdateLineItem(trade.id, item.id, 'profitPct', (parseFloat(e.target.value) || 0) / 100)}
                className="bg-secondary/30 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:border-primary/50 text-foreground"
                placeholder="0%"
              />
              <span className="text-xs font-mono text-success text-right pr-2 font-bold">
                {formatCurrency(item.lineTotal)}
              </span>
              <button
                onClick={() => onRemoveLineItem(trade.id, item.id)}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add Line Item / Library */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onAddLineItem(trade.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-primary border border-primary/20 rounded hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Line Item
            </button>
            {onOpenLibrary && (
              <button
                onClick={() => onOpenLibrary(trade.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-accent-foreground bg-accent/20 border border-accent/30 rounded hover:bg-accent/30 transition-colors"
              >
                <Package className="h-3 w-3" /> Add from Library
              </button>
            )}
          </div>

          {/* Trade Footer */}
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-6 text-muted-foreground">
              <span>Labor: {trade.totalLaborHours.toFixed(0)}h</span>
              <span>Duration: {trade.scheduleDurationDays}d</span>
              <span>Team: {trade.teamSize}P</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Cost: {formatCurrency(trade.totalExtCost)}</span>
              <span className="text-success">Profit: {formatCurrency(trade.totalProfit)}</span>
              <span className="text-primary font-bold text-sm">Total: {formatCurrency(trade.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePanel;

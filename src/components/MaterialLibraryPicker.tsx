import { useState, useEffect, useMemo } from 'react';
import { Search, X, Package, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchMaterialLibrary } from '@/services/estimateService';

interface MaterialItem {
  id: string;
  trade_code: string;
  trade_name: string;
  description: string;
  unit: string;
  unit_cost: number;
  cost_type: string;
  profit_pct: number;
  supplier: string;
  notes: string;
}

interface MaterialLibraryPickerProps {
  open: boolean;
  onClose: () => void;
  tradeGroup: string;
  onAddItems: (items: MaterialItem[]) => void;
}

// Map trade group names to material library trade_codes
const TRADE_GROUP_TO_CODES: Record<string, string[]> = {
  '01 Plans & Permits': ['01', '01.5'],
  '02 Mobilization': ['52', '52.1', '62', '63'],
  '03 Demo & Prep': ['02'],
  '04 Excavation': ['19'],
  '05 Footings': ['02.6'],
  '06 Foundation': ['02.7'],
  '07 Plumbing Underground': ['10'],
  '08 Concrete': ['04'],
  '09 Framing': ['06'],
  '10 Roofing': ['28'],
  '11 Plumbing Rough': ['10'],
  '12 Electrical Rough': ['11'],
  '13 HVAC Rough': ['20'],
  '14 Insulation': ['12'],
  '15 Drywall': ['13'],
  '16 Stucco': ['26'],
  '17 Interior Paint': ['14'],
  '18 Exterior Paint': ['14.5'],
  '19 Cabinets': ['15'],
  '20 Counter Tops': ['15.5'],
  '21 Tile': ['21'],
  '22 Flooring': ['22', '25'],
  '23 Interior Trim': ['17'],
  '24 Exterior Trim': ['18'],
  '25 Doors': ['16'],
  '26 Windows': ['16.5'],
  '27 HVAC Finish': ['20'],
  '28 Plumbing Finish': ['10'],
  '29 Electrical Finish': ['11'],
  '30 Appliances': ['23'],
  '31 Masonry': ['33'],
  '32 Decking': ['32'],
  '33 Fencing': ['31'],
  '34 Landscape': ['23.5'],
  '35 Rain Gutters': ['35'],
  '36 Stairs': ['39'],
  '37 Clean Up': ['22.5', '61'],
  '38 Punch List': [],
};

const MaterialLibraryPicker = ({ open, onClose, tradeGroup, onAddItems }: MaterialLibraryPickerProps) => {
  const [allItems, setAllItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAllTrades, setShowAllTrades] = useState(false);

  const tradeCodes = TRADE_GROUP_TO_CODES[tradeGroup] || [];

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelected(new Set());
    setShowAllTrades(false);
    setLoading(true);

    const load = async () => {
      try {
        // Load items for the mapped trade codes
        if (tradeCodes.length > 0) {
          const results = await Promise.all(tradeCodes.map(code => fetchMaterialLibrary(code)));
          setAllItems(results.flat() as MaterialItem[]);
        } else {
          // No mapping — load everything
          const data = await fetchMaterialLibrary();
          setAllItems(data as MaterialItem[]);
          setShowAllTrades(true);
        }
      } catch (err) {
        console.error('Failed to load material library:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, tradeGroup]);

  const handleLoadAll = async () => {
    setLoading(true);
    try {
      const data = await fetchMaterialLibrary();
      setAllItems(data as MaterialItem[]);
      setShowAllTrades(true);
    } catch (err) {
      console.error('Failed to load all materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter(
      item =>
        item.description.toLowerCase().includes(q) ||
        item.supplier?.toLowerCase().includes(q) ||
        item.cost_type.toLowerCase().includes(q) ||
        item.trade_name.toLowerCase().includes(q)
    );
  }, [allItems, search]);

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.id)));
    }
  };

  const handleAdd = () => {
    const items = allItems.filter(i => selected.has(i.id));
    onAddItems(items);
    onClose();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg tracking-wider uppercase">
            <Package className="h-5 w-5 text-primary" />
            Material Library — {tradeGroup}
          </DialogTitle>
        </DialogHeader>

        {/* Search + Actions */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description, supplier, or type..."
              className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          {!showAllTrades && tradeCodes.length > 0 && (
            <button
              onClick={handleLoadAll}
              className="px-3 py-2 text-xs font-mono border border-border rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Show All Trades
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-muted-foreground mb-2">
          {filtered.length} items{search && ` matching "${search}"`} · {selected.size} selected
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto border border-border/50 rounded">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-sm">Loading materials...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-sm">No materials found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-2 text-left">
                    <button onClick={toggleAll} className="p-0.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selected.size === filtered.length && filtered.length > 0
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/50'
                      }`}>
                        {selected.size === filtered.length && filtered.length > 0 && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                  </th>
                  {['Description', 'Unit', 'Unit Cost', 'Type', 'Profit', 'Supplier'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`border-b border-border/30 cursor-pointer transition-colors ${
                      selected.has(item.id) ? 'bg-primary/10' : i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                    } hover:bg-primary/5`}
                  >
                    <td className="px-3 py-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selected.has(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground/50'
                      }`}>
                        {selected.has(item.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-foreground">{item.description}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.unit}</td>
                    <td className="px-3 py-2 font-mono text-xs text-primary">{formatCurrency(item.unit_cost)}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground">{item.cost_type}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{((item.profit_pct || 0) * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[120px]">{item.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono border border-border rounded hover:bg-secondary/50 text-muted-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-heading font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Package className="h-3.5 w-3.5" />
            Add {selected.size} Item{selected.size !== 1 ? 's' : ''} to Estimate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialLibraryPicker;

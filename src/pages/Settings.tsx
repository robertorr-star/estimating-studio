import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import NavPills from '@/components/NavPills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Database, RefreshCw, TrendingUp, TrendingDown, Package, Users, Plus, Archive, Percent } from 'lucide-react';
import {
  getMaterialLibraryStats,
  bulkAdjustPricing,
  getUniqueSuppliers,
  getUniqueCostTypes,
} from '@/services/materialSeedService';
import {
  fetchEstimatorRates,
  updateEstimatorRate,
  addEstimator,
} from '@/services/timeTrackingService';

const Settings = () => {
  const [stats, setStats] = useState({ totalItems: 0, totalTrades: 0 });
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [costTypes, setCostTypes] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'supplier' | 'cost_type'>('supplier');
  const [filterValue, setFilterValue] = useState('');
  const [percentChange, setPercentChange] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Estimator rates
  const [rates, setRates] = useState<any[]>([]);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(() => {
    const stored = localStorage.getItem('autoArchiveEnabled');
    return stored === 'true';
  });
  const [autoArchiveDays, setAutoArchiveDays] = useState(() => {
    return localStorage.getItem('autoArchiveDays') || '90';
  });
  const [marginFloor, setMarginFloor] = useState(() => {
    return localStorage.getItem('marginFloor') || '28';
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, sup, ct, r] = await Promise.all([
        getMaterialLibraryStats(),
        getUniqueSuppliers(),
        getUniqueCostTypes(),
        fetchEstimatorRates(),
      ]);
      setStats(s);
      setSuppliers(sup);
      setCostTypes(ct);
      setRates(r);
    } catch (err) {
      console.error('Failed to load settings data', err);
    }
  };

  const handleAdjust = async () => {
    if (!filterValue || !percentChange) {
      toast.error('Select a filter and enter a percentage');
      return;
    }
    setAdjusting(true);
    try {
      const count = await bulkAdjustPricing(filterType, filterValue, parseFloat(percentChange));
      toast.success(`Updated ${count} items by ${percentChange}%`);
      setPercentChange('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust pricing');
    } finally {
      setAdjusting(false);
    }
  };

  const handleSaveRate = async (id: string) => {
    try {
      await updateEstimatorRate(id, parseFloat(editValue));
      toast.success('Rate updated');
      setEditingRate(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddEstimator = async () => {
    if (!newName || !newRate) return;
    try {
      await addEstimator(newName, parseFloat(newRate));
      toast.success(`${newName} added`);
      setNewName('');
      setNewRate('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const options = filterType === 'supplier' ? suppliers : costTypes;

  return (
    <div className="min-h-screen tactical-grid">
      <Header />
      <NavPills />
      <main className="px-6 py-6 max-w-4xl">
        <h1 className="text-2xl font-heading font-bold text-primary mb-6 tracking-wider uppercase">
          Settings
        </h1>

        {/* Material Library Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg tracking-wider uppercase">
              Material Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  <span className="text-foreground font-mono font-bold">{stats.totalItems}</span> items loaded
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  across <span className="text-foreground font-mono font-bold">{stats.totalTrades}</span> trades
                </span>
              </div>
            </div>

            {/* Bulk Pricing Adjustment */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Update Library Pricing
              </h3>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Filter By</label>
                  <Select
                    value={filterType}
                    onValueChange={(v) => {
                      setFilterType(v as 'supplier' | 'cost_type');
                      setFilterValue('');
                    }}
                  >
                    <SelectTrigger className="w-[140px] bg-secondary/30 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="cost_type">Cost Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {filterType === 'supplier' ? 'Supplier' : 'Cost Type'}
                  </label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="w-[220px] bg-secondary/30 border-border">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">% Change</label>
                  <div className="flex items-center gap-1">
                    {parseFloat(percentChange) > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ) : parseFloat(percentChange) < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    ) : null}
                    <Input
                      type="number"
                      value={percentChange}
                      onChange={(e) => setPercentChange(e.target.value)}
                      placeholder="+8 or -5"
                      className="w-[100px] bg-secondary/30 border-border font-mono"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAdjust}
                  disabled={adjusting || !filterValue || !percentChange}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {adjusting ? 'Updating...' : 'Apply'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Example: Select "Ganahl Lumber" → enter +8 → updates all Ganahl items by +8%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estimator Rates Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg tracking-wider uppercase">
              Estimator Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2">Estimator</th>
                  <th className="text-right py-2">Hourly Rate</th>
                  <th className="text-right py-2">Effective Date</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="py-2 font-medium">{r.estimator_name}</td>
                    <td className="py-2 text-right">
                      {editingRate === r.id ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 inline-block bg-secondary/30 border-border font-mono text-right"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono">${Number(r.hourly_rate).toFixed(2)}/hr</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-muted-foreground">{r.effective_date}</td>
                    <td className="py-2 text-right">
                      {editingRate === r.id ? (
                        <Button size="sm" variant="outline" onClick={() => handleSaveRate(r.id)}>Save</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingRate(r.id); setEditValue(String(r.hourly_rate)); }}>Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name"
                className="w-32 bg-secondary/30 border-border"
              />
              <Input
                type="number"
                value={newRate}
                onChange={e => setNewRate(e.target.value)}
                placeholder="$/hr"
                className="w-24 bg-secondary/30 border-border font-mono"
              />
              <Button size="sm" variant="outline" onClick={handleAddEstimator} disabled={!newName || !newRate}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Margin Floor Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <Percent className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg tracking-wider uppercase">
              Minimum Margin Floor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Estimates below this margin threshold will show a red warning banner.
              Robert must provide a reason to override and approve below-floor estimates.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Margin Floor %</label>
              <Input
                type="number"
                value={marginFloor}
                onChange={e => {
                  setMarginFloor(e.target.value);
                  localStorage.setItem('marginFloor', e.target.value);
                  toast.success(`Margin floor set to ${e.target.value}%`);
                }}
                className="w-20 bg-secondary/30 border-border font-mono"
                min={10}
                max={50}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>28% breakdown:</strong></p>
              <p>• 18% — Overhead coverage</p>
              <p>• 5% — Owner salary</p>
              <p>• 5% — Net profit</p>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Archive Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <Archive className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-lg tracking-wider uppercase">
              Auto-Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-archive inactive estimates</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically archive draft estimates with no activity after a set number of days.
                </p>
              </div>
              <Switch
                checked={autoArchiveEnabled}
                onCheckedChange={(checked) => {
                  setAutoArchiveEnabled(checked);
                  localStorage.setItem('autoArchiveEnabled', String(checked));
                  toast.success(checked ? 'Auto-archive enabled' : 'Auto-archive disabled');
                }}
              />
            </div>
            {autoArchiveEnabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Days of inactivity</label>
                <Input
                  type="number"
                  value={autoArchiveDays}
                  onChange={e => {
                    setAutoArchiveDays(e.target.value);
                    localStorage.setItem('autoArchiveDays', e.target.value);
                  }}
                  className="w-20 bg-secondary/30 border-border font-mono"
                  min={7}
                  max={365}
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;

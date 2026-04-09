import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Archive, XCircle, Trophy, CheckSquare, Square } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import KPIStrip from './KPIStrip';
import StatusBadge from './StatusBadge';
import { fetchEstimates, updateEstimateStatus } from '@/services/estimateService';
import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FilterTab = 'open' | 'active_projects' | 'archived' | 'all';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'active_projects', label: 'Active Projects' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
];

const EstimatesDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>('open');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogAction, setDialogAction] = useState<{ type: 'archive' | 'markLost' | 'markWon' | 'activate' | 'bulkArchive'; ids: string[] } | null>(null);
  const [codeAlerts, setCodeAlerts] = useState<any[]>([]);
  const [codeAlertsDismissed, setCodeAlertsDismissed] = useState(false);

  useEffect(() => {
    const loadCodeAlerts = async () => {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      const { data } = await supabase
        .from('code_updates')
        .select('*')
        .eq('status', 'upcoming')
        .lte('state_effective_date', ninetyDaysFromNow.toISOString().split('T')[0])
        .order('state_effective_date');
      setCodeAlerts(data || []);
    };
    loadCodeAlerts();
  }, []);

  const { data: dbEstimates, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: fetchEstimates,
  });

  const estimates = (dbEstimates || []).map((e: any) => ({
    id: e.id,
    estimateNumber: e.estimate_number,
    status: e.status,
    projectName: e.project_name,
    projectAddress: e.project_address || '',
    clientName: e.client_name || '',
    clientEmail: e.client_email || '',
    clientPhone: e.client_phone || '',
    projectType: e.project_type || '',
    totalSqFt: Number(e.total_sq_ft) || 0,
    projectStartDate: e.project_start_date || '',
    estimatedDurationDays: e.estimated_duration_days || 0,
    estimatedEndDate: e.estimated_end_date || '',
    totalBuildCost: Number(e.total_build_cost) || 0,
    totalProfit: Number(e.total_profit) || 0,
    grossMarginPct: Number(e.gross_margin_pct) || 0,
    totalContractPrice: Number(e.total_contract_price) || 0,
    costPerSqft: Number(e.cost_per_sqft) || 0,
    materialTaxRate: Number(e.material_tax_rate) || 0.1025,
    createdBy: e.created_by || 'Sigfried',
    builtBy: e.built_by || 'Sigfried',
    currentReviewer: e.current_reviewer || '',
    reviewedBy: e.reviewed_by || '',
    approvedBy: e.approved_by || '',
    notes: e.notes || '',
    internalNotes: e.internal_notes || '',
    createdAt: e.created_at,
  }));

  // Filter estimates by tab
  const filteredEstimates = estimates.filter((est: any) => {
    switch (activeTab) {
      case 'open':
        return !['archived', 'active_project'].includes(est.status);
      case 'active_projects':
        return est.status === 'active_project';
      case 'archived':
        return est.status === 'archived';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  // KPI only counts non-archived, non-active_project
  const kpiEstimates = estimates.filter((est: any) => !['archived'].includes(est.status));

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEstimates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEstimates.map((e: any) => e.id)));
    }
  };

  const executeAction = async () => {
    if (!dialogAction) return;
    try {
      const { type, ids } = dialogAction;
      for (const id of ids) {
        if (type === 'archive' || type === 'bulkArchive') {
          await updateEstimateStatus(id, 'archived');
        } else if (type === 'markLost') {
          await updateEstimateStatus(id, 'archived'); // rejected → archive
        } else if (type === 'markWon') {
          await updateEstimateStatus(id, 'signed');
        } else if (type === 'activate') {
          await updateEstimateStatus(id, 'active_project');
        }
      }
      const labels: Record<string, string> = {
        archive: 'Archived',
        bulkArchive: `Archived ${ids.length} estimates`,
        markLost: 'Marked as lost & archived',
        markWon: 'Marked as signed',
        activate: 'Activated as project',
      };
      toast.success(labels[type]);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setDialogAction(null);
    }
  };

  return (
    <div>
      {codeAlerts.length > 0 && !codeAlertsDismissed && (
        <div className="mb-4 p-3 border border-amber-500/30 bg-amber-500/5 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              ⚠ Code Update Alert — {codeAlerts.length} new code cycle{codeAlerts.length > 1 ? 's' : ''} being adopted
            </div>
            <button onClick={() => setCodeAlertsDismissed(true)}
              className="text-muted-foreground hover:text-foreground text-xs font-mono">DISMISS</button>
          </div>
          {codeAlerts.map(alert => (
            <div key={alert.id} className="mb-2 p-2 bg-secondary/20 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs font-mono text-foreground">{alert.code_name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">Effective: {alert.state_effective_date}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{(alert.key_changes || '').split('.')[0]}.</div>
              <div className="flex gap-3 mt-1">
                {alert.official_url && (
                  <a href={alert.official_url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 underline font-mono">Official Source →</a>
                )}
                {alert.summary_url && (
                  <a href={alert.summary_url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 underline font-mono">Summary →</a>
                )}
              </div>
            </div>
          ))}
          <div className="text-[9px] text-muted-foreground font-mono mt-1">
            IMPORTANT: Verify with each city which code edition they are currently accepting before designing.
          </div>
        </div>
      )}
      <KPIStrip estimates={kpiEstimates} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {TABS.map(tab => {
          const count = estimates.filter((est: any) => {
            switch (tab.key) {
              case 'open': return !['archived', 'active_project'].includes(est.status);
              case 'active_projects': return est.status === 'active_project';
              case 'archived': return est.status === 'archived';
              case 'all': return true;
              default: return true;
            }
          }).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
              className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label} <span className="ml-1 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-secondary/40 border border-border">
          <span className="text-xs font-mono text-muted-foreground">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogAction({ type: 'bulkArchive', ids: Array.from(selectedIds) })}
            className="text-xs"
          >
            <Archive className="h-3 w-3 mr-1" /> Archive Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-xs">
            Clear
          </Button>
        </div>
      )}

      {filteredEstimates.length === 0 && !isLoading && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground font-mono text-sm mb-4">
            {activeTab === 'open' ? 'No open estimates. Create your first one.' :
             activeTab === 'archived' ? 'No archived estimates.' :
             activeTab === 'active_projects' ? 'No active projects yet.' :
             'No estimates found.'}
          </p>
          {activeTab === 'open' && (
            <button
              onClick={() => navigate('/new-estimate')}
              className="flex items-center gap-2 mx-auto px-6 py-3 text-sm font-heading font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Estimate
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">Loading estimates...</p>
        </div>
      )}

      {filteredEstimates.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.size === filteredEstimates.length && filteredEstimates.length > 0
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  {['Estimate #', 'Project', 'Client', 'Built By', 'Status', 'Contract Price', 'Margin', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.map((est: any) => (
                  <tr
                    key={est.id}
                    className={`border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer ${selectedIds.has(est.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => navigate(`/estimate/${est.id}`)}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(est.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(est.id)
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">{est.estimateNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{est.projectName || '(Untitled)'}</div>
                      <div className="text-xs text-muted-foreground">{est.projectAddress}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{est.clientName || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {est.builtBy}
                      {est.currentReviewer && <span className="block text-[9px] text-warning">→ {est.currentReviewer}</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={est.status} /></td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">{formatCurrency(est.totalContractPrice)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-success">{est.grossMarginPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(est.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/estimate/${est.id}`)}
                          className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {est.status !== 'archived' && est.status !== 'active_project' && (
                          <>
                            <button
                              onClick={() => setDialogAction({ type: 'archive', ids: [est.id] })}
                              className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDialogAction({ type: 'markLost', ids: [est.id] })}
                              className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                              title="Mark Lost"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDialogAction({ type: 'markWon', ids: [est.id] })}
                              className="p-1.5 rounded hover:bg-success/20 text-muted-foreground hover:text-success transition-colors"
                              title="Mark Won"
                            >
                              <Trophy className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {(est.status === 'signed' || est.status === 'robert_approved') && (
                          <Button
                            size="sm"
                            onClick={() => setDialogAction({ type: 'activate', ids: [est.id] })}
                            className="ml-1 text-[10px] h-7 bg-teal-600 hover:bg-teal-700 text-white font-mono uppercase tracking-wider"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction?.type === 'archive' && 'Archive Estimate?'}
              {dialogAction?.type === 'bulkArchive' && `Archive ${dialogAction.ids.length} Estimates?`}
              {dialogAction?.type === 'markLost' && 'Mark as Lost & Archive?'}
              {dialogAction?.type === 'markWon' && 'Mark as Won (Signed)?'}
              {dialogAction?.type === 'activate' && 'Activate as Project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction?.type === 'archive' && 'This estimate will be moved to the Archived tab. You can find it there later.'}
              {dialogAction?.type === 'bulkArchive' && 'Selected estimates will be moved to the Archived tab.'}
              {dialogAction?.type === 'markLost' && 'This estimate will be marked as lost and archived. It will move to the Archived tab.'}
              {dialogAction?.type === 'markWon' && 'This estimate will be marked as signed. You can then activate it as a project.'}
              {dialogAction?.type === 'activate' && 'This will lock the estimate as a live active project. It will become read-only and move to the Active Projects tab.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EstimatesDashboard;

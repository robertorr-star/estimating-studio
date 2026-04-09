import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, ChevronLeft, FileText, Calendar, BarChart3, CheckSquare, Clock, Download } from 'lucide-react';
import TradePanel from '@/components/TradePanel';
import MaterialLibraryPicker from '@/components/MaterialLibraryPicker';
import LiveSummary from '@/components/LiveSummary';
import StatusBadge from '@/components/StatusBadge';
import ScheduleGantt from '@/components/ScheduleGantt';
import ApprovalBar from '@/components/ApprovalBar';
import HoursCostTab from '@/components/HoursCostTab';
import { DEFAULT_TRADES, DEFAULT_PROFIT_MARGINS, TEAM_RATES, PROJECT_TYPES } from '@/data/trades';
import type { EstimateTrade, EstimateLineItem } from '@/types/estimate';
import { useToast } from '@/hooks/use-toast';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { generateTakeoffPdf } from '@/services/takeoffPdfService';
import {
  createEstimate,
  fetchEstimate,
  updateEstimateProject,
  toggleTradeActive,
  updateTrade,
  addLineItem,
  updateLineItem,
  deleteLineItem,
  recalcTradeTotals,
  updateEstimateStatus,
} from '@/services/estimateService';
import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';
import { generateContract, generateContractHtml } from '@/services/contractService';

const generateId = () => crypto.randomUUID();

const createLocalTrades = (): EstimateTrade[] =>
  DEFAULT_TRADES.map((t) => ({
    id: generateId(),
    estimateId: '',
    tradeGroup: t.tradeGroup,
    tradeName: t.tradeName,
    sortOrder: t.sortOrder,
    isActive: false,
    totalLaborHours: 0, totalLaborCost: 0, totalMaterialsCost: 0,
    totalSubcontractCost: 0, totalEquipmentCost: 0, totalOtherCost: 0,
    totalExtCost: 0, totalProfit: 0, totalPrice: 0,
    scheduleDurationDays: 0, teamSize: t.defaultTeamSize,
    inspectionRequired: t.inspectionRequired, inspectionType: t.inspectionType,
    lineItems: [],
  }));

const recalcTradeLocal = (trade: EstimateTrade): EstimateTrade => {
  const items = trade.lineItems.map(item => {
    const extCost = item.quantity * item.unitCost;
    // profitPct is a margin rate: profit = cost * pct / (1 - pct)
    const profitAmount = item.profitPct < 1 && item.profitPct > 0
      ? extCost * item.profitPct / (1 - item.profitPct)
      : 0;
    return { ...item, extCost, profitAmount, lineTotal: extCost + profitAmount };
  });

  const totalExtCost = items.reduce((s, i) => s + i.extCost, 0);
  const totalProfit = items.reduce((s, i) => s + i.profitAmount, 0);
  const totalLaborHours = items.filter(i => i.costType === 'Labor').reduce((s, i) => s + i.quantity, 0);
  const laborDays = totalLaborHours > 0 ? Math.ceil(totalLaborHours / 8) : 0;
  const subDays = Math.max(0, ...items.filter(i => i.costType === 'Subcontract' && i.subDurationDays).map(i => i.subDurationDays || 0));

  return {
    ...trade, lineItems: items, totalExtCost, totalProfit,
    totalPrice: totalExtCost + totalProfit, totalLaborHours,
    totalLaborCost: items.filter(i => i.costType === 'Labor').reduce((s, i) => s + i.extCost, 0),
    totalMaterialsCost: items.filter(i => i.costType === 'Materials').reduce((s, i) => s + i.extCost, 0),
    totalSubcontractCost: items.filter(i => i.costType === 'Subcontract').reduce((s, i) => s + i.extCost, 0),
    totalEquipmentCost: items.filter(i => i.costType === 'Equipment').reduce((s, i) => s + i.extCost, 0),
    totalOtherCost: items.filter(i => ['Other', 'Design/Permit'].includes(i.costType)).reduce((s, i) => s + i.extCost, 0),
    scheduleDurationDays: Math.max(laborDays, subDays),
  };
};

type TabType = 'trades' | 'schedule' | 'proposal' | 'hours';

const EstimateBuilder = () => {
  const navigate = useNavigate();
  const { id: estimateId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('trades');

  const [dbEstimateId, setDbEstimateId] = useState<string | null>(estimateId || null);
  const [estimateNumber, setEstimateNumber] = useState('EST-XX-XXXX');
  const [status, setStatus] = useState<string>('draft');
  const [builtBy, setBuiltBy] = useState('Sigfried');
  const [builtCompletedAt, setBuiltCompletedAt] = useState<string | null>(null);
  const [sigfriedApprovedAt, setSigfriedApprovedAt] = useState<string | null>(null);
  const [leoApprovedAt, setLeoApprovedAt] = useState<string | null>(null);
  const [robertApprovedAt, setRobertApprovedAt] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectType, setProjectType] = useState('Remodel');
  const [totalSqFt, setTotalSqFt] = useState(0);
  const [projectStartDate, setProjectStartDate] = useState('');
  const [trades, setTrades] = useState<EstimateTrade[]>(createLocalTrades);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!estimateId);
  const [libraryTradeId, setLibraryTradeId] = useState<string | null>(null);
  const [projectCity, setProjectCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [jurisdiction, setJurisdiction] = useState<any>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [contractPreview, setContractPreview] = useState<any>(null);
  const libraryTrade = libraryTradeId ? trades.find(t => t.id === libraryTradeId) : null;

  // Time tracking
  const { trackActivity } = useTimeTracking(dbEstimateId, 'Sigfried');

  // Load existing estimate
  useEffect(() => {
    if (!estimateId) return;
    const load = async () => {
      try {
        const data = await fetchEstimate(estimateId);
        const est = data.estimate;
        setDbEstimateId(est.id);
        setEstimateNumber(est.estimate_number);
        setStatus(est.status);
        setBuiltBy(est.built_by || 'Sigfried');
        setBuiltCompletedAt(est.built_completed_at || null);
        setSigfriedApprovedAt(est.sigfried_approved_at || null);
        setLeoApprovedAt(est.leo_approved_at || null);
        setRobertApprovedAt(est.robert_approved_at || null);
        setProjectName(est.project_name);
        setProjectAddress(est.project_address || '');
        setClientName(est.client_name || '');
        setClientEmail(est.client_email || '');
        setClientPhone(est.client_phone || '');
        setProjectType(est.project_type || 'Remodel');
        setTotalSqFt(Number(est.total_sq_ft) || 0);
        setProjectStartDate(est.project_start_date || '');

        // Map DB trades + line items to local state
        const mappedTrades: EstimateTrade[] = data.trades.map((t: any) => {
          const tradeItems = data.lineItems
            .filter((li: any) => li.trade_id === t.id)
            .map((li: any) => ({
              id: li.id, estimateId: li.estimate_id, tradeId: li.trade_id,
              itemNumber: li.item_number || 1, accountCode: li.account_code || '',
              description: li.description || '', quantity: Number(li.quantity) || 0,
              unit: li.unit || 'each', unitCost: Number(li.unit_cost) || 0,
              extCost: Number(li.ext_cost) || 0, costType: li.cost_type || 'Materials',
              profitPct: Number(li.profit_pct) || 0, profitAmount: Number(li.profit_amount) || 0,
              lineTotal: Number(li.line_total) || 0, materialTaxApplied: li.material_tax_applied || false,
              notes: li.notes || '', sortOrder: li.sort_order || 0,
              subcontractorName: li.subcontractor_name || '', subDurationDays: li.sub_duration_days || 0,
            }));

          const trade: EstimateTrade = {
            id: t.id, estimateId: t.estimate_id, tradeGroup: t.trade_group,
            tradeName: t.trade_name, sortOrder: t.sort_order, isActive: t.is_active,
            totalLaborHours: Number(t.total_labor_hours) || 0,
            totalLaborCost: Number(t.total_labor_cost) || 0,
            totalMaterialsCost: Number(t.total_materials_cost) || 0,
            totalSubcontractCost: Number(t.total_subcontract_cost) || 0,
            totalEquipmentCost: Number(t.total_equipment_cost) || 0,
            totalOtherCost: Number(t.total_other_cost) || 0,
            totalExtCost: Number(t.total_ext_cost) || 0,
            totalProfit: Number(t.total_profit) || 0,
            totalPrice: Number(t.total_price) || 0,
            scheduleDurationDays: t.schedule_duration_days || 0,
            teamSize: t.team_size || 1,
            inspectionRequired: t.inspection_required || false,
            inspectionType: t.inspection_type || '',
            lineItems: tradeItems,
          };
          return recalcTradeLocal(trade);
        });

        setTrades(mappedTrades);
      } catch (err) {
        console.error('Failed to load estimate:', err);
        toast({ title: 'Error', description: 'Failed to load estimate', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [estimateId]);

  const searchCities = async (query: string) => {
    if (query.length < 2) { setCitySuggestions([]); return; }
    const { data } = await supabase.from('jurisdictions')
      .select('city_name').ilike('city_name', `${query}%`).limit(8);
    setCitySuggestions((data || []).map((r: any) => r.city_name));
  };

  const detectJurisdiction = async (cityName: string) => {
    setProjectCity(cityName);
    setCitySuggestions([]);
    if (!cityName) { setJurisdiction(null); return; }
    const { data } = await supabase.from('jurisdictions')
      .select('*').ilike('city_name', cityName).single();
    setJurisdiction(data || null);
    if (data && dbEstimateId) {
      await supabase.from('estimate_projects').update({
        project_city: data.city_name,
        jurisdiction_id: data.id,
        is_coastal: data.is_coastal,
        is_oc_county: data.is_oc_county,
      } as any).eq('id', dbEstimateId);
    }
  };

  const handleCityInput = (val: string) => {
    setProjectCity(val);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(val), 300);
  };

  const persistTradesAndTotals = async (estId: string, currentTrades: EstimateTrade[]) => {
    // Fetch DB trades to map by sort_order
    const { data: dbTrades } = await (await import('@/integrations/supabase/client')).supabase
      .from('estimate_trades')
      .select('id, sort_order')
      .eq('estimate_id', estId)
      .order('sort_order');

    const tradeMap = new Map((dbTrades || []).map((t: any) => [t.sort_order, t.id]));

    // Update each trade and save line items
    for (const trade of currentTrades) {
      const dbTradeId = tradeMap.get(trade.sortOrder) || trade.id;

      await updateTrade(dbTradeId, {
        is_active: trade.isActive,
        team_size: trade.teamSize,
        total_ext_cost: trade.totalExtCost,
        total_profit: trade.totalProfit,
        total_price: trade.totalPrice,
        total_labor_hours: trade.totalLaborHours,
        total_labor_cost: trade.totalLaborCost,
        total_materials_cost: trade.totalMaterialsCost,
        total_subcontract_cost: trade.totalSubcontractCost,
        total_equipment_cost: trade.totalEquipmentCost,
        total_other_cost: trade.totalOtherCost,
        schedule_duration_days: trade.scheduleDurationDays,
      });

      // Save line items for this trade
      for (const item of trade.lineItems) {
        await addLineItem({
          estimate_id: estId,
          trade_id: dbTradeId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unitCost,
          cost_type: item.costType,
          profit_pct: item.profitPct,
          sort_order: item.sortOrder,
        });
      }
    }

    // Roll up project totals
    const activeTrades = currentTrades.filter(t => t.isActive);
    const totalBuildCost = activeTrades.reduce((s, t) => s + t.totalExtCost, 0);
    const totalProfit = activeTrades.reduce((s, t) => s + t.totalProfit, 0);
    const totalContractPrice = totalBuildCost + totalProfit;
    const grossMargin = totalContractPrice > 0 ? (totalProfit / totalContractPrice) * 100 : 0;

    await updateEstimateProject(estId, {
      total_build_cost: totalBuildCost,
      total_profit: totalProfit,
      gross_margin_pct: grossMargin,
      total_contract_price: totalContractPrice,
      cost_per_sqft: totalSqFt > 0 ? totalContractPrice / totalSqFt : 0,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!dbEstimateId) {
        // Create new estimate
        const est = await createEstimate({
          projectName, projectAddress, clientName, clientEmail,
          clientPhone, projectType, totalSqFt, projectStartDate, builtBy,
        });
        setDbEstimateId(est.id);
        setEstimateNumber(est.estimate_number);

        // Persist trades, line items, and roll up totals
        await persistTradesAndTotals(est.id, trades);

        toast({ title: 'Estimate Created', description: `${est.estimate_number} saved successfully` });
        navigate(`/estimate/${est.id}`, { replace: true });
      } else {
        // Update existing - first delete old line items and re-insert
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('estimate_line_items').delete().eq('estimate_id', dbEstimateId);

        // Update project fields
        await updateEstimateProject(dbEstimateId, {
          project_name: projectName,
          project_address: projectAddress,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          project_type: projectType,
          total_sq_ft: totalSqFt,
          project_start_date: projectStartDate || null,
          built_by: builtBy,
        });

        // Persist trades, line items, and roll up totals
        await persistTradesAndTotals(dbEstimateId, trades);

        toast({ title: 'Saved', description: 'Estimate updated successfully' });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTrade = useCallback((tradeId: string) => {
    setTrades(prev => prev.map(t =>
      t.id === tradeId ? { ...t, isActive: !t.isActive } : t
    ));
  }, []);

  const handleAddLineItem = useCallback((tradeId: string) => {
    trackActivity('takeoff_entry');
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      const newItem: EstimateLineItem = {
        id: generateId(), estimateId: dbEstimateId || '', tradeId,
        itemNumber: t.lineItems.length + 1, accountCode: '',
        description: '', quantity: 0, unit: 'each', unitCost: 0, extCost: 0,
        costType: 'Materials', profitPct: DEFAULT_PROFIT_MARGINS['Materials'],
        profitAmount: 0, lineTotal: 0, materialTaxApplied: false,
        notes: '', sortOrder: t.lineItems.length + 1,
      };
      return recalcTradeLocal({ ...t, lineItems: [...t.lineItems, newItem] });
    }));
  }, [dbEstimateId, trackActivity]);

  const handleRemoveLineItem = useCallback((tradeId: string, itemId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      return recalcTradeLocal({ ...t, lineItems: t.lineItems.filter(i => i.id !== itemId) });
    }));
  }, []);

  const handleUpdateLineItem = useCallback((tradeId: string, itemId: string, field: string, value: any) => {
    trackActivity('takeoff_entry');
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      const items = t.lineItems.map(item => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === 'costType') {
          updated.profitPct = DEFAULT_PROFIT_MARGINS[value as string] ?? 0;
        }
        return updated;
      });
      return recalcTradeLocal({ ...t, lineItems: items });
    }));
  }, [trackActivity]);

  const handleTeamSizeChange = useCallback((tradeId: string, size: number) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      return recalcTradeLocal({ ...t, teamSize: size });
    }));
  }, []);

  const handleOpenLibrary = useCallback((tradeId: string) => {
    setLibraryTradeId(tradeId);
    trackActivity('material_library');
  }, [trackActivity]);

  const handleLibraryAdd = useCallback((items: any[]) => {
    if (!libraryTradeId) return;
    setTrades(prev => prev.map(t => {
      if (t.id !== libraryTradeId) return t;
      const newItems: EstimateLineItem[] = items.map((item, idx) => ({
        id: generateId(),
        estimateId: dbEstimateId || '',
        tradeId: libraryTradeId,
        itemNumber: t.lineItems.length + idx + 1,
        accountCode: '',
        description: item.description,
        quantity: 1,
        unit: item.unit,
        unitCost: item.unit_cost,
        extCost: item.unit_cost,
        costType: item.cost_type,
        profitPct: item.profit_pct || 0,
        profitAmount: (item.profit_pct && item.profit_pct < 1)
          ? item.unit_cost * item.profit_pct / (1 - item.profit_pct)
          : 0,
        lineTotal: (item.profit_pct && item.profit_pct < 1)
          ? item.unit_cost / (1 - item.profit_pct)
          : item.unit_cost,
        materialTaxApplied: false,
        notes: item.notes || '',
        sortOrder: t.lineItems.length + idx,
        subcontractorName: '',
        subDurationDays: 0,
      }));
      return recalcTradeLocal({ ...t, lineItems: [...t.lineItems, ...newItems] });
    }));
    toast({ title: 'Items Added', description: `${items.length} item${items.length !== 1 ? 's' : ''} added from library` });
  }, [libraryTradeId, dbEstimateId, trackActivity, toast]);

  const handleStatusChange = async (newStatus: string) => {
    if (!dbEstimateId) {
      toast({ title: 'Save First', description: 'Save the estimate before changing status', variant: 'destructive' });
      return;
    }
    try {
      const now = new Date().toISOString();
      const additionalFields: Record<string, any> = {};

      if (newStatus === 'submitted_to_sigfried') {
        additionalFields.built_completed_at = now;
        additionalFields.current_reviewer = 'Sigfried';
        setBuiltCompletedAt(now);
      } else if (newStatus === 'sigfried_approved') {
        // If Sigfried built it, also set built_completed_at
        if (!builtCompletedAt) {
          additionalFields.built_completed_at = now;
          setBuiltCompletedAt(now);
        }
        additionalFields.sigfried_approved_at = now;
        additionalFields.current_reviewer = 'Leo';
        setSigfriedApprovedAt(now);
      } else if (newStatus === 'leo_approved') {
        additionalFields.leo_approved_at = now;
        additionalFields.current_reviewer = 'Robert';
        setLeoApprovedAt(now);
      } else if (newStatus === 'robert_approved') {
        additionalFields.robert_approved_at = now;
        additionalFields.current_reviewer = null;
        additionalFields.approved_by = 'Robert';
        setRobertApprovedAt(now);
      } else if (newStatus === 'sigfried_send_back') {
        additionalFields.sigfried_approved_at = null;
        additionalFields.current_reviewer = 'Sigfried';
        setSigfriedApprovedAt(null);
        // Increment send-back counter via raw SQL isn't possible here, so we track in status
        newStatus = 'draft';
      } else if (newStatus === 'leo_send_back') {
        additionalFields.leo_approved_at = null;
        additionalFields.current_reviewer = 'Leo';
        setLeoApprovedAt(null);
        newStatus = 'sigfried_approved';
      }

      await updateEstimateStatus(dbEstimateId, newStatus, additionalFields);
      setStatus(newStatus);
      toast({ title: 'Status Updated', description: `Estimate is now ${newStatus.replace(/_/g, ' ')}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const printProposal = () => {
    const activeTrades = trades.filter(t => t.isActive);
    const totalPrice = activeTrades.reduce((s, t) => s + t.totalPrice, 0);
    const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
    const fmt$ = (n: number) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const tradeSections = activeTrades.map(trade => {
      const scopeLines = trade.lineItems.map(li => `<div style="font-size:11px;color:#333;margin:2px 0">${li.description || ""}</div>`).join("");
      return `
      <div style="margin-bottom: 0;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1.5px solid #222;padding:10px 0 6px;margin-top:16px">
          <div style="font-size:13px;font-weight:bold">${trade.sortOrder || ""} ${trade.tradeName || ""} Group</div>
          <div style="font-size:13px;font-style:italic;font-weight:bold">${fmt$(trade.totalPrice || 0)}</div>
        </div>
        <div style="padding-left:16px">
          <div style="font-size:12px;font-weight:bold;font-style:italic;margin-bottom:4px">${trade.tradeName}-</div>
          ${scopeLines}
        </div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Proposal — ${projectName}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; color: #222; font-size: 12px; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #1B4D1B; margin-bottom: 20px; }
  .sig-block { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 10px; color: #555; }
  .total-line { display:flex;justify-content:space-between;border-top:2px solid #222;border-bottom:2px solid #222;padding:10px 0;margin-top:20px;font-size:14px;font-weight:bold; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style></head><body><div class="page">
<div class="letterhead">
  <div>
    <div style="font-weight:bold;font-size:14px">Orr Construction Company</div>
    <div style="font-size:10px;color:#555">1977 Obispo Ave, Signal Hill, California 90755</div>
    <div style="font-size:10px;color:#555">(562) 498-0224 · License #1028720</div>
  </div>
</div>
<h2 style="font-size:18px;font-weight:bold;margin:0 0 6px">PROPOSAL SHEET</h2>
<div style="font-size:14px;font-weight:bold;margin-bottom:6px">${projectAddress || ""}</div>
<div style="font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:20px;line-height:1.4">${projectName || ""}</div>
${tradeSections}
<div class="total-line">
  <span>Total Price</span>
  <span>${fmt$(totalPrice)}</span>
</div>
<div style="font-size:10px;color:#666;margin-top:12px;font-style:italic">
  Note: This is just a rough estimate and may vary based on approved plans and scope of work to be done.
</div>
<div class="sig-block">
  <div><div class="sig-line">Client Signature</div><div class="sig-line">Date</div></div>
  <div><div class="sig-line">Client Signature</div><div class="sig-line">Date</div></div>
  <div>
    <div class="sig-line">Contractor Signature</div>
    <div style="font-size:10px;color:#555;margin-top:4px">Robert Orr, President</div>
    <div style="font-size:10px;color:#555">Orr Construction Company</div>
    <div class="sig-line">Date: ${today}</div>
  </div>
</div>
<button class="no-print" onclick="window.print()" style="margin-top:24px;padding:8px 20px;background:#1B4D1B;color:#C9A84C;border:none;font-weight:bold;cursor:pointer;font-size:12px">
  PRINT / SAVE PDF
</button>
</div></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleExportTakeoff = () => {
    const activeTrades = trades.filter(t => t.isActive);
    const totalContractPrice = activeTrades.reduce((s, t) => s + t.totalPrice, 0);
    generateTakeoffPdf({
      estimateNumber, projectName, projectAddress, clientName,
      projectType, totalSqFt, createdBy: 'Sigfried', reviewedBy: 'Robert',
      approvedDate: new Date().toLocaleDateString(), status, trades,
      projectStartDate,
    });
    toast({ title: 'PDF Generated', description: 'Takeoff PDF downloaded' });
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'schedule') trackActivity('schedule');
    else if (tab === 'proposal') trackActivity('proposal');
    else if (tab === 'hours') trackActivity('review');
  };

  const tabs = [
    { id: 'trades' as TabType, label: 'TRADE SCOPE', icon: FileText },
    { id: 'schedule' as TabType, label: 'SCHEDULE', icon: Calendar },
    { id: 'proposal' as TabType, label: 'PROPOSAL', icon: BarChart3 },
    { id: 'hours' as TabType, label: 'HOURS & COST', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground font-mono text-sm">Loading estimate...</div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="p-2 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-primary">{estimateNumber}</span>
                <StatusBadge status={status as any} />
              </div>
              <h2 className="font-heading text-base sm:text-xl font-bold tracking-wide uppercase truncate">
                {projectName || 'New Estimate'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto pl-10 sm:pl-0">
            <button
              onClick={printProposal}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-mono border border-border rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors flex-1 sm:flex-initial justify-center"
            >
              🖨 <span className="hidden sm:inline">PRINT PROPOSAL</span><span className="sm:hidden">PROP</span>
            </button>
            <button
              onClick={handleExportTakeoff}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-mono border border-primary/50 rounded hover:bg-primary/10 text-primary transition-colors flex-1 sm:flex-initial justify-center"
            >
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">EXPORT TAKEOFF</span><span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-mono border border-border rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex-1 sm:flex-initial justify-center"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Approval Bar */}
        {(() => {
          const activeTrades = trades.filter(t => t.isActive);
          const totalBuildCost = activeTrades.reduce((s, t) => s + t.totalExtCost, 0);
          const totalProfit = activeTrades.reduce((s, t) => s + t.totalProfit, 0);
          const totalContractPrice = totalBuildCost + totalProfit;
          const gm = totalContractPrice > 0 ? (totalProfit / totalContractPrice) * 100 : 0;
          return <ApprovalBar status={status} grossMargin={gm} builtBy={builtBy} builtCompletedAt={builtCompletedAt} sigfriedApprovedAt={sigfriedApprovedAt} leoApprovedAt={leoApprovedAt} robertApprovedAt={robertApprovedAt} onStatusChange={handleStatusChange} />;
        })()}

        {/* Contract Generation Panel */}
        {(status === 'robert_approved' || status === 'active_project') && (
          <div className="rounded-lg border border-border bg-card p-4 mb-4">
            <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-3">Contract Generation</div>
            {!contractPreview ? (
              <button
                onClick={async () => {
                  if (!dbEstimateId) return;
                  setGeneratingContract(true);
                  const result = await generateContract(dbEstimateId);
                  setGeneratingContract(false);
                  if (result.success && result.previewData) {
                    setContractPreview(result.previewData);
                    toast({ title: 'Contract ready', description: 'Review below before printing or sending' });
                  } else {
                    toast({ title: 'Error', description: result.error || 'Failed to generate contract', variant: 'destructive' });
                  }
                }}
                disabled={generatingContract}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-primary/40 rounded hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
              >
                {generatingContract ? 'PREPARING...' : '📄 GENERATE CONTRACT →'}
              </button>
            ) : (
              <div>
                <div className="text-xs text-green-400 font-mono mb-3">✓ Contract ready — review before sending</div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
                  <div><span className="text-muted-foreground">Client: </span><span>{contractPreview.clientName}</span></div>
                  <div><span className="text-muted-foreground">Contract: </span><span className="text-green-400">{contractPreview.contractPrice}</span></div>
                  <div><span className="text-muted-foreground">Start: </span><span>{contractPreview.startDate || 'TBD'}</span></div>
                  <div><span className="text-muted-foreground">End: </span><span>{contractPreview.endDate || 'TBD'}</span></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const html = generateContractHtml({
                        effectiveDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                        ownerName: contractPreview.clientName || '',
                        ownerAddress: contractPreview.projectAddress || '',
                        projectAddress: contractPreview.projectAddress || '',
                        contractPrice: contractPreview.contractPrice,
                        downpayment: contractPreview.downpayment,
                        payments: contractPreview.payments,
                        startDate: contractPreview.startDate || '',
                        endDate: contractPreview.endDate || '',
                      });
                      const win = window.open('', '_blank');
                      if (win) { win.document.write(html); win.document.close(); }
                      toast({ title: 'Contract opened', description: 'Use Print → Save as PDF to download' });
                    }}
                    className="px-3 py-1.5 text-[10px] font-mono border border-blue-500/30 rounded hover:bg-blue-500/10 text-blue-400 transition-colors"
                  >
                    PREVIEW / PRINT PDF
                  </button>
                  <button
                    onClick={() => toast({ title: 'DocuSign', description: 'Configure DocuSign API credentials in Supabase app_settings to enable direct sending.' })}
                    className="px-3 py-1.5 text-[10px] font-mono border border-primary/30 rounded hover:bg-primary/10 text-primary transition-colors"
                  >
                    SEND VIA DOCUSIGN →
                  </button>
                  <button
                    onClick={() => setContractPreview(null)}
                    className="px-3 py-1.5 text-[10px] font-mono border border-border rounded hover:bg-secondary/50 text-muted-foreground transition-colors"
                  >
                    RESET
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Info Bar */}
        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Project Name', value: projectName, setter: setProjectName, placeholder: 'Enter project name' },
              { label: 'Address', value: projectAddress, setter: setProjectAddress, placeholder: 'Project address' },
              { label: 'Client Name', value: clientName, setter: setClientName, placeholder: 'Client name' },
              { label: 'Client Email', value: clientEmail, setter: setClientEmail, placeholder: 'client@email.com' },
              { label: 'Client Phone', value: clientPhone, setter: setClientPhone, placeholder: '(562) 555-0000' },
            ].map(field => (
              <div key={field.label}>
                <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">{field.label}</label>
                <input value={field.value} onChange={e => field.setter(e.target.value)} className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground" placeholder={field.placeholder} />
              </div>
            ))}
            {/* City autocomplete with jurisdiction detection */}
            <div className="relative">
              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">City / Jurisdiction</label>
              <input
                value={projectCity}
                onChange={e => handleCityInput(e.target.value)}
                onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                placeholder="Signal Hill, Long Beach..."
              />
              {citySuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 w-full bg-card border border-border rounded shadow-lg mt-0.5">
                  {citySuggestions.map(c => (
                    <button key={c} onMouseDown={() => detectJurisdiction(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 text-foreground">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Built By</label>
              <select value={builtBy} onChange={e => setBuiltBy(e.target.value)} className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground">
                {['Sigfried', 'Joseph', 'Jess', 'Jake'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Project Type</label>
              <select value={projectType} onChange={e => setProjectType(e.target.value)} className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground">
                {PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Total SF</label>
              <input type="number" value={totalSqFt || ''} onChange={e => setTotalSqFt(parseFloat(e.target.value) || 0)} className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50 text-foreground" placeholder="0" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Start Date</label>
              <input type="date" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} className="w-full bg-secondary/30 border border-border/50 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-primary/50 text-foreground" />
            </div>
          </div>
          {/* Jurisdiction info */}
          {jurisdiction && (
            <div className="mt-3 p-2 border border-amber-500/30 bg-amber-500/5 text-xs space-y-1">
              {jurisdiction.is_coastal && (
                <div className="text-red-400 font-bold font-mono">⚠ COASTAL ZONE — California Coastal Commission CDP required</div>
              )}
              {jurisdiction.is_oc_county && (
                <div className="text-orange-400 font-bold font-mono">⚠ OC COUNTY — 5-department process + HOA approval first</div>
              )}
              {jurisdiction.has_strong_hoa && !jurisdiction.is_oc_county && (
                <div className="text-orange-400 font-mono">⚠ HOA approval required before permit submittal</div>
              )}
              {jurisdiction.has_historic_overlay && (
                <div className="text-yellow-400 font-mono">⚠ Historic district overlay — verify if project is in overlay zone</div>
              )}
              <div className="text-muted-foreground font-mono">
                Plan check: {jurisdiction.first_review_days_min}–{jurisdiction.first_review_days_max} days first review
                {jurisdiction.school_district && ` · School: ${jurisdiction.school_district}`}
                {jurisdiction.fire_authority && ` · Fire: ${jurisdiction.fire_authority}`}
              </div>
              {jurisdiction.special_requirements && (
                <div className="text-muted-foreground font-mono text-[10px]">{jurisdiction.special_requirements}</div>
              )}
              {jurisdiction.plan_check_portal && (
                <a href={jurisdiction.plan_check_portal} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 underline font-mono text-[10px]">Building Dept Portal →</a>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-4 border-b border-border pb-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-t text-[11px] sm:text-xs font-heading font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'trades' && (
          <div className="space-y-2">
            {trades.map(trade => (
              <TradePanel
                key={trade.id}
                trade={trade}
                onToggle={handleToggleTrade}
                onUpdateLineItem={handleUpdateLineItem}
                onAddLineItem={handleAddLineItem}
                onRemoveLineItem={handleRemoveLineItem}
                onTeamSizeChange={handleTeamSizeChange}
                onOpenLibrary={handleOpenLibrary}
              />
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <ScheduleGantt trades={trades} projectStartDate={projectStartDate} />
        )}

        {activeTab === 'proposal' && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold tracking-wider uppercase text-primary">
                Orr Construction & Development
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                CSLB License #1028720 | DVBE | SDVOSB | 184th Infantry | Iraq Veteran
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                1977 Obispo Ave, Signal Hill, CA 90755 | (562) 498-0224
              </p>
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <h3 className="font-heading text-lg font-bold uppercase mb-2">Project Proposal</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Project:</strong> {projectName || '—'} | <strong>Address:</strong> {projectAddress || '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Client:</strong> {clientName || '—'} | <strong>Estimate:</strong> {estimateNumber}
              </p>
            </div>
            {trades.filter(t => t.isActive).map(trade => (
              <div key={trade.id} className="mb-4 pb-4 border-b border-border/50">
                <h4 className="font-heading text-sm font-bold uppercase text-primary mb-2">
                  {trade.tradeGroup}
                </h4>
                {trade.lineItems.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    {trade.lineItems.map(item => (
                      <li key={item.id}>• {item.description || 'Line item'} — {item.quantity} {item.unit}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Scope to be defined</p>
                )}
                <p className="text-sm font-mono text-primary mt-2 text-right">
                  Trade Total: ${trade.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t-2 border-primary/30">
              <div className="flex justify-between items-center">
                <span className="font-heading text-lg font-bold uppercase">Total Contract Price</span>
                <span className="font-mono text-2xl font-bold text-primary">
                  ${trades.filter(t => t.isActive).reduce((s, t) => s + t.totalPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                This estimate is valid for 30 days from the date of this proposal.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <HoursCostTab
            estimateId={dbEstimateId}
            estimateNumber={estimateNumber}
            projectName={projectName}
            status={status}
            contractValue={trades.filter(t => t.isActive).reduce((s, t) => s + t.totalPrice, 0)}
          />
        )}
      </div>

      {/* Sticky Summary Sidebar - desktop only */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <LiveSummary trades={trades} totalSqFt={totalSqFt} projectStartDate={projectStartDate} />
      </div>
    </div>

    {/* Mobile Summary - below main content */}
    <div className="lg:hidden mt-4">
      <LiveSummary trades={trades} totalSqFt={totalSqFt} projectStartDate={projectStartDate} />
    </div>

    {/* Material Library Picker */}
    <MaterialLibraryPicker
      open={!!libraryTradeId}
      onClose={() => setLibraryTradeId(null)}
      tradeGroup={libraryTrade?.tradeGroup || ''}
      onAddItems={handleLibraryAdd}
    />
    </>
  );
};

export default EstimateBuilder;

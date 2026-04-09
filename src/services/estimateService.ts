import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';
import { DEFAULT_TRADES, DEFAULT_PROFIT_MARGINS, TEAM_RATES } from '@/data/trades';
import type { EstimateTrade, EstimateLineItem } from '@/types/estimate';

// Generate estimate number: EST-YY-NNNN
export const generateEstimateNumber = async (): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2);
  const { count } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true });
  const num = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `EST-${year}-${num}`;
};

// Create a new estimate with all trades
export const createEstimate = async (projectData: {
  projectName: string;
  projectAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectType: string;
  totalSqFt: number;
  projectStartDate: string;
  builtBy?: string;
}) => {
  const estimateNumber = await generateEstimateNumber();

  const { data: estimate, error: estError } = await supabase
    .from('estimates')
    .insert({
      estimate_number: estimateNumber,
      project_name: projectData.projectName,
      project_address: projectData.projectAddress,
      client_name: projectData.clientName,
      client_email: projectData.clientEmail,
      client_phone: projectData.clientPhone,
      project_type: projectData.projectType,
      total_sq_ft: projectData.totalSqFt,
      project_start_date: projectData.projectStartDate || null,
      built_by: projectData.builtBy || 'Sigfried',
      status: 'draft',
    })
    .select()
    .single();

  if (estError) throw estError;

  // Create all trades for this estimate
  const tradesToInsert = DEFAULT_TRADES.map((t) => ({
    estimate_id: estimate.id,
    trade_group: t.tradeGroup,
    trade_name: t.tradeName,
    sort_order: t.sortOrder,
    is_active: false,
    team_size: t.defaultTeamSize,
    inspection_required: t.inspectionRequired,
    inspection_type: t.inspectionType,
    relationship_type: t.relationshipType,
    lag_days: t.lagDays,
  }));

  const { error: tradesError } = await supabase
    .from('estimate_trades')
    .insert(tradesToInsert);

  if (tradesError) throw tradesError;

  return estimate;
};

// Fetch full estimate with trades and line items
export const fetchEstimate = async (estimateId: string) => {
  const { data: estimate, error: estError } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', estimateId)
    .single();

  if (estError) throw estError;

  const { data: trades, error: tradesError } = await supabase
    .from('estimate_trades')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('sort_order');

  if (tradesError) throw tradesError;

  const { data: lineItems, error: itemsError } = await supabase
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('sort_order');

  if (itemsError) throw itemsError;

  return { estimate, trades: trades || [], lineItems: lineItems || [] };
};

// Fetch all estimates for dashboard
export const fetchEstimates = async () => {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update estimate project fields
export const updateEstimateProject = async (id: string, updates: Record<string, any>) => {
  const { error } = await supabase
    .from('estimates')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

// Toggle trade active state
export const toggleTradeActive = async (tradeId: string, isActive: boolean) => {
  const { error } = await supabase
    .from('estimate_trades')
    .update({ is_active: isActive })
    .eq('id', tradeId);
  if (error) throw error;
};

// Update trade fields
export const updateTrade = async (tradeId: string, updates: Record<string, any>) => {
  const { error } = await supabase
    .from('estimate_trades')
    .update(updates)
    .eq('id', tradeId);
  if (error) throw error;
};

// Add a line item
export const addLineItem = async (item: {
  estimate_id: string;
  trade_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  cost_type: string;
  profit_pct: number;
  sort_order: number;
}) => {
  const extCost = item.quantity * item.unit_cost;
  // profitPct is a margin rate: profit = cost * pct / (1 - pct)
  const profitAmount = item.profit_pct < 1 && item.profit_pct > 0
    ? extCost * item.profit_pct / (1 - item.profit_pct)
    : 0;
  const { data, error } = await supabase
    .from('estimate_line_items')
    .insert({
      ...item,
      ext_cost: extCost,
      profit_amount: profitAmount,
      line_total: extCost + profitAmount,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Update a line item
export const updateLineItem = async (itemId: string, updates: Record<string, any>) => {
  const { error } = await supabase
    .from('estimate_line_items')
    .update(updates)
    .eq('id', itemId);
  if (error) throw error;
};

// Delete a line item
export const deleteLineItem = async (itemId: string) => {
  const { error } = await supabase
    .from('estimate_line_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
};

// Update estimate status
export const updateEstimateStatus = async (
  estimateId: string,
  status: string,
  additionalFields?: Record<string, any>
) => {
  const updates: Record<string, any> = { status, ...additionalFields };
  if (status === 'submitted') updates.submitted_date = new Date().toISOString().split('T')[0];
  if (status === 'approved') updates.approved_date = new Date().toISOString().split('T')[0];
  if (status === 'signed') updates.client_signed_date = new Date().toISOString().split('T')[0];
  if (status === 'converted_to_project') updates.converted_date = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('estimates')
    .update(updates)
    .eq('id', estimateId);
  if (error) throw error;

  // Sync client contact info from estimate_projects to estimates on approval
  if (['robert_approved', 'approved', 'converted_to_project', 'active_project'].includes(status)) {
    const { data: epData } = await supabase
      .from('estimate_projects')
      .select('client_email, client_phone')
      .eq('id', estimateId)
      .single();
    if (epData?.client_email) {
      await supabase.from('estimates').update({
        client_email: epData.client_email,
        client_phone: epData.client_phone || null,
      } as any).eq('id', estimateId);
    }
  }

  // Auto-link: when activating, create a PM Studio job and set job_id
  if (status === 'converted_to_project' || status === 'active_project') {
    await autoCreateJob(estimateId);
  }
};

// Create a job in PM Studio's jobs table from the activated estimate
const autoCreateJob = async (estimateId: string) => {
  try {
    const { data: est } = await supabase
      .from('estimates')
      .select('id, project_name, project_address, client_name, client_email, client_phone, total_contract_price, job_id')
      .eq('id', estimateId)
      .single();

    if (!est || est.job_id) return; // already linked

    // Fetch active trades for phases
    const { data: activeTrades } = await supabase
      .from('estimate_trades')
      .select('trade_name, trade_group, sort_order, total_labor_hours, schedule_start_date, schedule_end_date')
      .eq('estimate_id', estimateId)
      .eq('is_active', true)
      .order('sort_order');

    const jobId = crypto.randomUUID();
    const { error: jobErr } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        name: est.project_name,
        address: est.project_address,
        client_name: est.client_name,
        client_email: (est as any).client_email || null,
        client_phone: (est as any).client_phone || null,
        contract_value: est.total_contract_price || 0,
        contract_remaining: est.total_contract_price || 0,
        phases_total: activeTrades?.length || 0,
        phases_complete: 0,
        phase_pct: 0,
        health: 'green',
        score: 'A',
      });

    if (jobErr) {
      console.error('Failed to create PM job:', jobErr.message);
      return;
    }

    // Auto-create phases from active trades
    if (activeTrades?.length) {
      const phases = activeTrades.map((t, idx) => ({
        job_id: jobId,
        name: t.trade_name,
        trade: t.trade_group,
        sort_order: t.sort_order,
        num: idx + 1,
        estimated_hrs: String(t.total_labor_hours || 0),
        start_date: t.schedule_start_date || null,
        end_date: t.schedule_end_date || null,
        status: 'not_started',
      }));

      const { error: phaseErr } = await supabase
        .from('phases')
        .insert(phases);

      if (phaseErr) {
        console.error('Failed to create PM phases:', phaseErr.message);
      } else {
        console.log(`Created ${phases.length} PM phases for job ${jobId}`);
      }
    }

    // Auto-create materials from material-type line items
    const { data: lineItems } = await supabase
      .from('estimate_line_items')
      .select('description, quantity, unit, unit_cost, cost_type, trade_id')
      .eq('estimate_id', estimateId);

    if (lineItems?.length) {
      // Build trade_id → trade_name/group lookup
      const tradeMap = new Map(
        (activeTrades || []).map(t => [t.trade_name, t.trade_group])
      );
      // We need trade_id → name mapping; fetch it
      const { data: tradeRows } = await supabase
        .from('estimate_trades')
        .select('id, trade_name, trade_group')
        .eq('estimate_id', estimateId)
        .eq('is_active', true);
      const tradeIdMap = new Map(
        (tradeRows || []).map(t => [t.id, { name: t.trade_name, group: t.trade_group }])
      );

      const materialItems = lineItems
        .filter(li => li.cost_type === 'Materials' || li.cost_type === 'Equipment')
        .map((li, idx) => {
          const tradeInfo = tradeIdMap.get(li.trade_id);
          return {
            job_id: jobId,
            item_name: li.description || 'Unnamed item',
            qty: String(li.quantity || 0),
            quantity: li.quantity || 0,
            unit: li.unit || 'each',
            unit_cost: li.unit_cost || 0,
            trade: tradeInfo?.name || null,
            phase_name: tradeInfo?.group || null,
            source: 'estimate',
            status: 'not_ordered',
            priority: 'Normal',
            sort_order: idx + 1,
            added_by: 'Estimating Studio',
          };
        });

      if (materialItems.length) {
        const { error: matErr } = await supabase
          .from('materials')
          .insert(materialItems);

        if (matErr) {
          console.error('Failed to create PM materials:', matErr.message);
        } else {
          console.log(`Created ${materialItems.length} PM materials for job ${jobId}`);
        }
      }
    }

    // ─── Create projects record (Financial Studio) ───────────────────
    const { error: projErr } = await supabase
      .from('projects')
      .insert({
        id: jobId,
        project_name: est.project_name,
        client_name: est.client_name,
        contract_amount: est.total_contract_price || 0,
        billed_amount: 0,
        status: 'active',
        description: est.project_address,
      } as any);
    if (projErr) {
      console.error('Failed to create Financial Studio project:', projErr.message);
    }

    // ─── Create billing items (SOV) with 50/50 milestone splits ──────
    const { data: tradesWithPrice } = await supabase
      .from('estimate_trades')
      .select('id, trade_name, trade_group, sort_order, total_price, total_materials_cost, total_labor_cost')
      .eq('estimate_id', estimateId)
      .eq('is_active', true)
      .order('sort_order');

    if (tradesWithPrice?.length) {
      const billingRows: any[] = [];
      let itemNum = 1;
      const SPLIT_THRESHOLD = 2000;

      // Always add Mobilization as item 1
      const mobAmount = Math.min(Math.round((est.total_contract_price || 0) * 0.04), 1500);
      if (mobAmount > 0) {
        billingRows.push({
          job_id: jobId,
          item_number: itemNum++,
          phase_name: 'Mobilization',
          description: 'Mobilization to Job Site',
          contract_amount: mobAmount,
          total_paid: 0,
          remaining_balance: mobAmount,
          remaining_balance_pct: 100,
          this_invoice: 0,
          sort_order: 1,
          status: 'not_started',
          updated_at: new Date().toISOString(),
        });
      }

      for (const trade of tradesWithPrice) {
        const tradePrice = Number((trade as any).total_price || 0);
        const matCost = Number((trade as any).total_materials_cost || 0);
        if (tradePrice <= 0) continue;

        const baseSort = ((trade as any).sort_order || 1) * 10;

        if (tradePrice >= SPLIT_THRESHOLD) {
          let materialsPct = matCost > 0 ? Math.min(Math.max(Math.round(matCost / tradePrice * 10) * 10, 30), 60) : 50;
          const materialsAmt = Math.round(tradePrice * materialsPct / 100 * 100) / 100;
          const completionAmt = Math.round((tradePrice - materialsAmt) * 100) / 100;

          billingRows.push({
            job_id: jobId,
            item_number: itemNum++,
            phase_name: (trade as any).trade_group || (trade as any).trade_name,
            description: `${(trade as any).trade_name} — Materials & Start`,
            contract_amount: materialsAmt,
            total_paid: 0,
            remaining_balance: materialsAmt,
            remaining_balance_pct: 100,
            this_invoice: 0,
            sort_order: baseSort,
            status: 'not_started',
            updated_at: new Date().toISOString(),
          });

          billingRows.push({
            job_id: jobId,
            item_number: itemNum++,
            phase_name: (trade as any).trade_group || (trade as any).trade_name,
            description: `${(trade as any).trade_name} — Completion`,
            contract_amount: completionAmt,
            total_paid: 0,
            remaining_balance: completionAmt,
            remaining_balance_pct: 100,
            this_invoice: 0,
            sort_order: baseSort + 1,
            status: 'not_started',
            updated_at: new Date().toISOString(),
          });
        } else {
          billingRows.push({
            job_id: jobId,
            item_number: itemNum++,
            phase_name: (trade as any).trade_group || (trade as any).trade_name,
            description: (trade as any).trade_name,
            contract_amount: tradePrice,
            total_paid: 0,
            remaining_balance: tradePrice,
            remaining_balance_pct: 100,
            this_invoice: 0,
            sort_order: baseSort,
            status: 'not_started',
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (billingRows.length) {
        const { error: billingErr } = await supabase
          .from('billing_items')
          .insert(billingRows);
        if (billingErr) {
          console.error('Failed to create billing items:', billingErr.message);
        } else {
          console.log(`Created ${billingRows.length} billing items (SOV) for job ${jobId}`);
        }
      }
    }
    // ─── End billing items ───────────────────────────────────────────

    // Link estimate to the new job
    await supabase
      .from('estimates')
      .update({ job_id: jobId })
      .eq('id', estimateId);

    console.log(`PM job created: ${jobId} for estimate ${estimateId}`);

    // Notify that job conversion succeeded
    await supabase.from('notifications').insert({
      type: 'general',
      title: `Job created in PM Studio: ${(est as any).project_name}`,
      body: `Estimate converted successfully. Leo can now access this job.`,
      job_id: jobId,
      job_name: (est as any).project_name,
      from_user: 'System',
      to_user: 'ALL',
      priority: 'normal',
      action_data: { tab: 'jobs', job_id: jobId },
    } as any).catch(() => {});

  } catch (err: any) {
    console.error('Auto-create job failed:', err);
    // Notify failure
    await supabase.from('notifications').insert({
      type: 'general',
      title: `JOB CREATION FAILED`,
      body: `Estimate conversion failed. Check Supabase logs. Job was NOT created in PM Studio.`,
      from_user: 'System',
      to_user: 'Andy',
      priority: 'critical',
    } as any).catch(() => {});
  }
};

// Recalculate trade totals from line items
export const recalcTradeTotals = (lineItems: any[]) => {
  const totalExtCost = lineItems.reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);
  const totalProfit = lineItems.reduce((s: number, i: any) => s + (i.profit_amount || 0), 0);
  const totalLaborHours = lineItems.filter((i: any) => i.cost_type === 'Labor').reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const totalLaborCost = lineItems.filter((i: any) => i.cost_type === 'Labor').reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);
  const totalMaterialsCost = lineItems.filter((i: any) => i.cost_type === 'Materials').reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);
  const totalSubcontractCost = lineItems.filter((i: any) => i.cost_type === 'Subcontract').reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);
  const totalEquipmentCost = lineItems.filter((i: any) => i.cost_type === 'Equipment').reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);
  const totalOtherCost = lineItems.filter((i: any) => ['Other', 'Design/Permit'].includes(i.cost_type)).reduce((s: number, i: any) => s + (i.ext_cost || 0), 0);

  return {
    total_ext_cost: totalExtCost,
    total_profit: totalProfit,
    total_price: totalExtCost + totalProfit,
    total_labor_hours: totalLaborHours,
    total_labor_cost: totalLaborCost,
    total_materials_cost: totalMaterialsCost,
    total_subcontract_cost: totalSubcontractCost,
    total_equipment_cost: totalEquipmentCost,
    total_other_cost: totalOtherCost,
  };
};

// Fetch material library
export const fetchMaterialLibrary = async (tradeCode?: string) => {
  let query = supabase
    .from('material_library')
    .select('*')
    .eq('is_active', true)
    .order('trade_code')
    .order('description');

  if (tradeCode) {
    query = query.eq('trade_code', tradeCode);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

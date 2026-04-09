import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';
import { OCD_MATERIAL_DB } from '@/data/materialLibrary';

export const seedMaterialLibrary = async (): Promise<number> => {
  // Check if already seeded
  const { count } = await supabase
    .from('material_library')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) return 0;

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < OCD_MATERIAL_DB.length; i += batchSize) {
    const batch = OCD_MATERIAL_DB.slice(i, i + batchSize).map((item) => ({
      trade_code: item.trade_code,
      trade_name: item.trade_name,
      description: item.description,
      unit: item.unit,
      unit_cost: item.unit_cost,
      cost_type: item.cost_type,
      profit_pct: item.profit_pct,
      supplier: item.supplier,
      notes: item.notes,
      is_active: true,
    }));

    const { error } = await supabase.from('material_library').insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }

  return inserted;
};

export const getMaterialLibraryStats = async () => {
  const { count } = await supabase
    .from('material_library')
    .select('*', { count: 'exact', head: true });

  const { data: trades } = await supabase
    .from('material_library')
    .select('trade_code')
    .eq('is_active', true);

  const uniqueTrades = new Set(trades?.map((t) => t.trade_code) || []);

  return { totalItems: count ?? 0, totalTrades: uniqueTrades.size };
};

export const bulkAdjustPricing = async (
  filterType: 'supplier' | 'cost_type',
  filterValue: string,
  percentChange: number
) => {
  // Fetch matching items
  const { data: items, error: fetchError } = await supabase
    .from('material_library')
    .select('id, unit_cost')
    .eq(filterType === 'supplier' ? 'supplier' : 'cost_type', filterValue)
    .eq('is_active', true);

  if (fetchError) throw fetchError;
  if (!items || items.length === 0) return 0;

  const multiplier = 1 + percentChange / 100;

  for (const item of items) {
    const newCost = Math.round(item.unit_cost * multiplier * 100) / 100;
    const { error } = await supabase
      .from('material_library')
      .update({ unit_cost: newCost })
      .eq('id', item.id);
    if (error) throw error;
  }

  return items.length;
};

export const getUniqueSuppliers = async (): Promise<string[]> => {
  const { data } = await supabase
    .from('material_library')
    .select('supplier')
    .eq('is_active', true);

  const unique = [...new Set((data || []).map((d) => d.supplier).filter(Boolean))];
  return unique.sort() as string[];
};

export const getUniqueCostTypes = async (): Promise<string[]> => {
  const { data } = await supabase
    .from('material_library')
    .select('cost_type')
    .eq('is_active', true);

  const unique = [...new Set((data || []).map((d) => d.cost_type).filter(Boolean))];
  return unique.sort() as string[];
};

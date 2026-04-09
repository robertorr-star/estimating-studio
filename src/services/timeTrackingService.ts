import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';

// Start a new time session
export const startSession = async (estimateId: string, userName: string = 'Sigfried'): Promise<string | null> => {
  const { data, error } = await supabase
    .from('estimate_time_sessions')
    .insert({
      estimate_id: estimateId,
      user_name: userName,
      session_start: new Date().toISOString(),
      activity_type: 'review',
      keystrokes_detected: false,
    })
    .select('id')
    .single();
  if (error) { console.error('Failed to start session:', error); return null; }
  return data.id;
};

// End a session
export const endSession = async (sessionId: string) => {
  const { data: session } = await supabase
    .from('estimate_time_sessions')
    .select('session_start')
    .eq('id', sessionId)
    .single();
  if (!session) return;
  const start = new Date(session.session_start).getTime();
  const end = Date.now();
  const duration = (end - start) / 60000; // minutes
  await supabase
    .from('estimate_time_sessions')
    .update({ session_end: new Date().toISOString(), duration_minutes: duration })
    .eq('id', sessionId);
};

// Update activity type on a session
export const updateSessionActivity = async (sessionId: string, activityType: string) => {
  await supabase
    .from('estimate_time_sessions')
    .update({ activity_type: activityType, keystrokes_detected: true })
    .eq('id', sessionId);
};

// Mark session as idle
export const markSessionIdle = async (sessionId: string) => {
  const now = new Date().toISOString();
  const { data: session } = await supabase
    .from('estimate_time_sessions')
    .select('session_start')
    .eq('id', sessionId)
    .single();
  if (!session) return;
  const duration = (Date.now() - new Date(session.session_start).getTime()) / 60000;
  await supabase
    .from('estimate_time_sessions')
    .update({ session_end: now, duration_minutes: duration, activity_type: 'idle' })
    .eq('id', sessionId);
};

// Fetch sessions for an estimate
export const fetchSessions = async (estimateId: string) => {
  const { data, error } = await supabase
    .from('estimate_time_sessions')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('session_start', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Fetch estimator rates
export const fetchEstimatorRates = async () => {
  const { data, error } = await supabase
    .from('estimator_rates')
    .select('*')
    .order('estimator_name');
  if (error) throw error;
  return data || [];
};

// Update estimator rate
export const updateEstimatorRate = async (id: string, hourlyRate: number) => {
  const { error } = await supabase
    .from('estimator_rates')
    .update({ hourly_rate: hourlyRate })
    .eq('id', id);
  if (error) throw error;
};

// Add estimator
export const addEstimator = async (name: string, rate: number) => {
  const { error } = await supabase
    .from('estimator_rates')
    .insert({ estimator_name: name, hourly_rate: rate, effective_date: new Date().toISOString().split('T')[0] });
  if (error) throw error;
};

// Upsert cost summary for an estimate
export const updateCostSummary = async (estimateId: string) => {
  // Fetch all sessions for this estimate
  const sessions = await fetchSessions(estimateId);
  const rates = await fetchEstimatorRates();
  const rateMap: Record<string, number> = {};
  rates.forEach(r => { rateMap[r.estimator_name] = Number(r.hourly_rate); });

  const hoursByUser: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.activity_type === 'idle') return;
    const mins = Number(s.duration_minutes) || 0;
    hoursByUser[s.user_name] = (hoursByUser[s.user_name] || 0) + mins / 60;
  });

  const hSig = hoursByUser['Sigfried'] || 0;
  const hJos = hoursByUser['Joseph'] || 0;
  const hRob = hoursByUser['Robert'] || 0;
  const totalHours = hSig + hJos + hRob;
  const cSig = hSig * (rateMap['Sigfried'] || 35);
  const cJos = hJos * (rateMap['Joseph'] || 30);
  const cRob = hRob * (rateMap['Robert'] || 75);
  const totalCost = cSig + cJos + cRob;

  // Get estimate info
  const { data: est } = await supabase
    .from('estimates')
    .select('estimate_number, project_name, created_by, status, total_contract_price, total_sq_ft')
    .eq('id', estimateId)
    .single();

  if (!est) return;

  const contractValue = Number(est.total_contract_price) || 0;
  const won = est.status === 'signed' || est.status === 'converted_to_project';
  const returnOnEstimate = totalCost > 0 && won ? contractValue / totalCost : null;

  const { data: existing } = await supabase
    .from('estimate_cost_summary')
    .select('id')
    .eq('estimate_id', estimateId)
    .maybeSingle();

  const payload = {
    estimate_id: estimateId,
    estimate_number: est.estimate_number,
    project_name: est.project_name,
    estimator_primary: est.created_by || 'Sigfried',
    total_hours_sigfried: hSig,
    total_hours_joseph: hJos,
    total_hours_robert: hRob,
    total_hours_all: totalHours,
    cost_sigfried: cSig,
    cost_joseph: cJos,
    cost_robert: cRob,
    total_estimate_cost: totalCost,
    estimate_status: est.status,
    contract_value: contractValue,
    return_on_estimate: returnOnEstimate,
    won: won || null,
    last_updated: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from('estimate_cost_summary').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('estimate_cost_summary').insert(payload);
  }
};

// Fetch all cost summaries for analytics
export const fetchAllCostSummaries = async () => {
  const { data, error } = await supabase
    .from('estimate_cost_summary')
    .select('*')
    .order('last_updated', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Fetch all sessions for analytics
export const fetchAllSessions = async () => {
  const { data, error } = await supabase
    .from('estimate_time_sessions')
    .select('*')
    .order('session_start', { ascending: false });
  if (error) throw error;
  return data || [];
};

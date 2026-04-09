import { sharedSupabase as supabase } from '@/integrations/supabase/sharedClient';

const fmt$ = (n: number) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d?: string | null) => {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
};

export const generateContract = async (estimateId: string): Promise<{
  success: boolean;
  signingUrl?: string;
  envelopeId?: string;
  error?: string;
  previewData?: any;
}> => {
  try {
    // 1. Load estimate data
    const { data: est, error: estErr } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();
    if (estErr || !est) throw new Error('Estimate not found');

    // 2. Load billing items (SOV / payment schedule)
    const { data: billingItems } = await supabase
      .from('billing_items')
      .select('description, contract_amount, sort_order')
      .eq('job_id', (est as any).job_id || '')
      .order('sort_order');

    // 3. Load earliest/latest trade dates
    const { data: trades } = await supabase
      .from('estimate_trades')
      .select('schedule_start_date, schedule_end_date')
      .eq('estimate_id', estimateId)
      .not('schedule_start_date', 'is', null)
      .order('schedule_start_date');

    // 4. Load DocuSign settings
    const { data: settings } = await supabase
      .from('app_settings' as any)
      .select('key, value');
    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    // 5. Build preview data
    const contractPrice = Number((est as any).total_contract_price || (est as any).total_price || 0);
    const downpayment = Math.min(1000, contractPrice * 0.1);
    const payments = (billingItems || []).slice(0, 7);
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const startDate = (trades as any)?.[0]?.schedule_start_date
      ? formatDate((trades as any)[0].schedule_start_date) : '';
    const endDate = (trades as any)?.[(trades as any)?.length - 1]?.schedule_end_date
      ? formatDate((trades as any)[(trades as any).length - 1].schedule_end_date) : '';

    const previewData = {
      clientName: (est as any).client_name || '',
      projectAddress: (est as any).project_address || '',
      contractPrice: fmt$(contractPrice),
      downpayment: fmt$(downpayment),
      startDate,
      endDate,
      payments: (payments || []).map((item: any, i: number) => ({
        number: i + 2,
        amount: fmt$(item.contract_amount || 0),
        milestone: item.description || '',
      })),
    };

    // Store draft record
    if ((est as any).job_id) {
      await supabase.from('job_documents').insert({
        job_id: (est as any).job_id,
        job_name: (est as any).project_name || '',
        file_name: `contract_draft_${((est as any).project_name || 'project').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`,
        storage_path: `contracts/draft/${estimateId}`,
        category: 'contract',
        uploaded_by: 'System',
        notes: `Auto-generated contract — ${today}`,
      } as any);
    }

    return { success: true, previewData };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const generateContractHtml = (data: {
  effectiveDate: string;
  ownerName: string;
  ownerAddress: string;
  projectAddress: string;
  contractPrice: string;
  downpayment: string;
  payments: { number: number; amount: string; milestone: string }[];
  startDate: string;
  endDate: string;
  scopeItems?: { tradeName: string; description: string; amount: string; costType: string }[];
  estimateNumber?: string;
}): string => {
  const paymentRows = data.payments.map(p =>
    `<tr>
      <td style="padding:6px 8px;border:1px solid #ddd;font-weight:bold">Payment ${p.number}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">${p.amount}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">Upon completion of: ${p.milestone}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.7; color: #222; max-width: 800px; margin: 40px auto; padding: 0 40px; }
  h1 { text-align: center; font-size: 16px; text-decoration: underline; text-transform: uppercase; }
  h2 { font-size: 13px; font-weight: bold; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #f5f5f5; padding: 6px 8px; border: 1px solid #ddd; text-align: left; font-size: 12px; }
  .highlight { background: #fffde7; padding: 2px 4px; }
  .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-line { border-top: 1px solid #222; margin-top: 40px; padding-top: 6px; font-size: 12px; }
  .footer { text-align: center; font-size: 11px; color: #777; margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { margin: 0; padding: 20px; } }
</style></head>
<body>
<h1>Construction — Residential Home Remodel<br>Home Improvement Contract</h1>
<p style="text-align:center;font-size:11px;font-weight:bold">YOU ARE ENTITLED TO A COMPLETELY FILLED IN COPY OF THIS AGREEMENT, SIGNED BY BOTH YOU AND THE CONTRACTOR BEFORE ANY WORK MAY BE STARTED.</p>

<p>This Construction Contract for the remodel of a residential home is made and entered into as of this
<span class="highlight">${data.effectiveDate}</span> (the "Effective Date"), between
<strong>Orr Construction Company</strong>, a California corporation ("Orr" or "Contractor"), and
<span class="highlight"><strong>${data.ownerName}</strong></span> ("Owner").</p>

<p>Orr maintains California general contractor's license <strong>No. 1028720</strong> and operates a home
remodeling business in California. Orr's primary place of business is
<strong>1977 Obispo Ave., Signal Hill, CA 90755</strong>.</p>

<p>Owner resides at <span class="highlight">${data.ownerAddress}</span> and is engaging Orr to perform
home remodeling services at <span class="highlight"><strong>${data.projectAddress}</strong></span> (the "Project").</p>

<h2>1. Description of Project and Scope of Work</h2>
<p>See <strong>Exhibit A — Scope of Work &amp; Compensation</strong>, attached hereto and incorporated by reference.</p>

<h2>2. Start Date and Completion Date</h2>
<p>The work shall commence on <span class="highlight">${data.startDate || 'TBD'}</span> and be completed on or before
<span class="highlight">${data.endDate || 'TBD'}</span>, subject to adjustments as provided in this Agreement.</p>

<h2>3. Contract Price</h2>
<p>Owner shall pay Orr the Contract Price of <span class="highlight"><strong>${data.contractPrice}</strong></span>.
The Contract Price is payable according to the following Schedule of Progress Payments:</p>

<table>
  <tr><th>Payment</th><th>Amount</th><th>Milestone</th></tr>
  <tr>
    <td style="padding:6px 8px;border:1px solid #ddd;font-weight:bold">Payment 1 — DOWNPAYMENT</td>
    <td style="padding:6px 8px;border:1px solid #ddd">${data.downpayment}</td>
    <td style="padding:6px 8px;border:1px solid #ddd">Due at signing (10% or $1,000, whichever is less)</td>
  </tr>
  ${paymentRows}
</table>

<p style="font-size:11px;font-style:italic">IT IS AGAINST THE LAW FOR A CONTRACTOR TO COLLECT PAYMENT FOR WORK NOT YET COMPLETED, OR FOR MATERIALS NOT YET DELIVERED. HOWEVER, A CONTRACTOR MAY REQUIRE A DOWNPAYMENT. THE DOWNPAYMENT MAY NOT EXCEED $1,000 OR 10 PERCENT OF THE CONTRACT PRICE, WHICHEVER IS LESS.</p>

<h2>4. Changes in Work</h2>
<p>The Owner and Orr may agree in writing upon changes in the Work. Extra work or a change order is not enforceable against the Owner unless the change order identifies in writing: (1) the scope; (2) the amount to be added or subtracted; and (3) the effect on the schedule. All change orders require written authorization prior to the commencement of any extra work.</p>

<h2>5. Insurance</h2>
<p>Orr carries commercial general liability insurance written by <strong>ICW Group</strong>. You may call
<strong>(888) 892-3910</strong> to verify coverage. Orr carries workers' compensation insurance for all employees.</p>

<h2>6. Warranty</h2>
<p>Orr warrants that materials and equipment will be new and of good quality, the Work will be free from defects, and the Work will conform to the requirements of this Agreement. All warranties commence upon completion and final payment.</p>

<h2>7. Permits</h2>
<p>Orr shall obtain and pay for the building permit and other permits and governmental fees, licenses, and inspections necessary for proper execution and completion of the Work. Orr shall provide Owner with copies of all permits and inspection approvals.</p>

<h2>8. Mechanics Lien Warning</h2>
<p style="font-size:11px">Anyone who helps improve your property, but who is not paid, may record a mechanics lien on your property. To preserve their right to record a lien, each subcontractor and material supplier must provide you with a "Preliminary Notice." You can protect yourself from liens by getting a list from your contractor of all subcontractors and material suppliers. For more information visit <strong>www.cslb.ca.gov</strong> or call CSLB at <strong>800-321-2752</strong>.</p>

<h2>9. Dispute Resolution</h2>
<p>If the Parties have a dispute, they agree to: (1) meet in person at the project site; (2) if unresolved, attend mediation (fees split equally); (3) if still unresolved, file a civil lawsuit in the county where the Work was performed. The prevailing party shall be awarded reasonable attorney's fees and costs.</p>

<h2>10. Three-Day Right to Cancel</h2>
<p>You, the buyer, have the right to cancel this contract within three business days. You may cancel by emailing, mailing, faxing, or delivering written notice to Orr Construction Company, 1977 Obispo Ave., Signal Hill, CA 90755, by midnight of the third business day after receiving a signed copy.</p>

<div class="sig-block">
  <div>
    <p><strong>Orr Construction Company</strong></p>
    <div class="sig-line">Signature</div>
    <div class="sig-line">Name: Robert A. Orr</div>
    <div class="sig-line">Title: President</div>
    <div class="sig-line">Date:</div>
  </div>
  <div>
    <p><strong>${data.ownerName}</strong></p>
    <div class="sig-line">Signature</div>
    <div class="sig-line">Name:</div>
    <div class="sig-line">Date:</div>
  </div>
</div>

<div class="footer">
  Orr Construction Company · License #1028720 · 1977 Obispo Ave., Signal Hill, CA 90755 · (562) 498-0224<br>
  <em>Note: Owner is entitled to a completely filled-in copy of this Agreement, signed by both parties, before any work may be started.</em>
</div>

${(data.scopeItems && data.scopeItems.length > 0) ? `
<div style="page-break-before:always;padding:40px">
  <h2 style="text-align:center;font-size:15px;text-decoration:underline;text-transform:uppercase;margin-bottom:20px">Exhibit A — Scope of Work</h2>
  <p style="font-size:12px;margin-bottom:16px">This Exhibit A is incorporated by reference into the Construction Contract dated ${data.effectiveDate} between Orr Construction Company and ${data.ownerName} for the Project at ${data.projectAddress}.${data.estimateNumber ? ` Estimate #${data.estimateNumber}.` : ''}</p>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#1B4D1B;color:#C9A84C">
      <th style="padding:8px 10px;text-align:left">Trade / Phase</th>
      <th style="padding:8px 10px;text-align:left">Scope Description</th>
      <th style="padding:8px 10px;text-align:left">Type</th>
      <th style="padding:8px 10px;text-align:right">Amount</th>
    </tr></thead>
    <tbody>
      ${data.scopeItems.map((item, i) => `<tr style="background:${i % 2 === 0 ? '#f9f9f7' : '#fff'}">
        <td style="padding:7px 10px;font-weight:bold;font-size:11px">${item.tradeName}</td>
        <td style="padding:7px 10px;font-size:11px">${item.description}</td>
        <td style="padding:7px 10px;font-size:11px;color:#555">${item.costType}</td>
        <td style="padding:7px 10px;text-align:right;font-size:11px">${item.amount}</td>
      </tr>`).join('')}
      <tr style="background:#1B4D1B;color:#C9A84C;font-weight:bold">
        <td colspan="3" style="padding:8px 10px;text-align:right;font-size:12px">Total Contract Price</td>
        <td style="padding:8px 10px;text-align:right;font-size:13px">${data.contractPrice}</td>
      </tr>
    </tbody>
  </table>
  <p style="font-size:11px;margin-top:16px;color:#555;font-style:italic">This scope may be amended only by a written change order signed by both parties per Section 4 of the Agreement.</p>
</div>` : ''}

<div style="page-break-before:always;padding:40px">
  <h2 style="text-align:center;font-size:15px;text-decoration:underline;text-transform:uppercase;margin-bottom:20px">Exhibit B — Schedule of Progress Payments</h2>
  <p style="font-size:12px;margin-bottom:16px">Payment schedule for: ${data.projectAddress}. All payments due within 2 business days of written milestone notification from Orr.</p>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#1B4D1B;color:#C9A84C">
      <th style="padding:8px 10px;text-align:left">#</th>
      <th style="padding:8px 10px;text-align:left">Milestone</th>
      <th style="padding:8px 10px;text-align:right">Amount Due</th>
      <th style="padding:8px 10px;text-align:center">Date Paid</th>
      <th style="padding:8px 10px;text-align:center">Check #</th>
    </tr></thead>
    <tbody>
      <tr style="background:#f9f9f7">
        <td style="padding:7px 10px">1</td>
        <td style="padding:7px 10px;font-weight:bold">DOWNPAYMENT — Due at Signing</td>
        <td style="padding:7px 10px;text-align:right">${data.downpayment}</td>
        <td style="padding:7px 10px;text-align:center;color:#aaa">____________</td>
        <td style="padding:7px 10px;text-align:center;color:#aaa">____________</td>
      </tr>
      ${data.payments.map((p, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f7'}">
        <td style="padding:7px 10px">${p.number}</td>
        <td style="padding:7px 10px">Upon completion of: <strong>${p.milestone}</strong></td>
        <td style="padding:7px 10px;text-align:right;font-weight:bold">${p.amount}</td>
        <td style="padding:7px 10px;text-align:center;color:#aaa">____________</td>
        <td style="padding:7px 10px;text-align:center;color:#aaa">____________</td>
      </tr>`).join('')}
      <tr style="background:#1B4D1B;color:#C9A84C;font-weight:bold">
        <td colspan="2" style="padding:8px 10px;text-align:right">TOTAL CONTRACT PRICE</td>
        <td style="padding:8px 10px;text-align:right;font-size:13px">${data.contractPrice}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
  <p style="font-size:10px;margin-top:12px;color:#555;font-style:italic;text-transform:uppercase">IT IS AGAINST THE LAW FOR A CONTRACTOR TO COLLECT PAYMENT FOR WORK NOT YET COMPLETED, OR FOR MATERIALS NOT YET DELIVERED.</p>
  <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
    <div>
      <div style="border-top:1px solid #222;margin-top:40px;padding-top:6px;font-size:11px">Orr Construction Company</div>
      <div style="border-top:1px solid #222;margin-top:20px;padding-top:6px;font-size:11px">Date</div>
    </div>
    <div>
      <div style="border-top:1px solid #222;margin-top:40px;padding-top:6px;font-size:11px">${data.ownerName} (Owner)</div>
      <div style="border-top:1px solid #222;margin-top:20px;padding-top:6px;font-size:11px">Date</div>
    </div>
  </div>
</div>
</body></html>`;
};

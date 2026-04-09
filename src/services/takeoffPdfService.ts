import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EstimateTrade } from '@/types/estimate';

interface TakeoffPdfData {
  estimateNumber: string;
  projectName: string;
  projectAddress: string;
  clientName: string;
  projectType: string;
  totalSqFt: number;
  createdBy: string;
  reviewedBy: string;
  approvedDate: string;
  status: string;
  trades: EstimateTrade[];
  projectStartDate: string;
  estimateCost?: number;
  contractValue?: number;
  returnOnEstimate?: number;
}

const NAVY = [13, 27, 42] as const;
const GOLD = [201, 168, 76] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_GRAY = [245, 245, 245] as const;

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const generateTakeoffPdf = (data: TakeoffPdfData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54; // 0.75 inch
  const contentW = pageW - margin * 2;
  let pageNum = 0;

  const addHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text('OCD ESTIMATING STUDIO', margin, 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.estimateNumber}  |  ${data.projectName}`, margin, 26);
  };

  const addFooter = () => {
    pageNum++;
    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 28, pageW, 28, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text(`OCD Internal Takeoff  |  ${data.estimateNumber}  |  Page ${pageNum}`, margin, pageH - 10);
  };

  const newPage = () => {
    doc.addPage();
    addHeader();
  };

  // ===== PAGE 1: COVER =====
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(margin, 180, contentW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('ORR CONSTRUCTION & DEVELOPMENT', margin, 120);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('DVBE  |  SDVOSB  |  184 INF  |  CSLB #1028720', margin, 140);

  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text('PROJECT COST', margin, 230);
  doc.text('TAKEOFF', margin, 262);

  doc.setFillColor(...GOLD);
  doc.rect(margin, 280, 80, 3, 'F');

  let y = 320;
  const coverField = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(value, margin + 120, y);
    y += 22;
  };

  coverField('Estimate:', data.estimateNumber);
  coverField('Project:', data.projectName);
  coverField('Address:', data.projectAddress || '—');
  coverField('Client:', data.clientName || '—');
  coverField('Type / SF:', `${data.projectType}  |  ${data.totalSqFt.toLocaleString()} SF`);
  coverField('Prepared by:', data.createdBy || 'Sigfried');
  coverField('Reviewed by:', data.reviewedBy || '—');
  coverField('Date:', data.approvedDate || new Date().toLocaleDateString());

  // Status badge
  y += 10;
  const statusText = data.status.toUpperCase().replace(/_/g, ' ');
  doc.setFillColor(...GOLD);
  doc.roundedRect(margin, y, 100, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(statusText, margin + 50, y + 15, { align: 'center' });

  // Won estimate cost info
  if (data.estimateCost && data.contractValue && data.returnOnEstimate) {
    y += 40;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(`ESTIMATE PRODUCTION COST: ${fmtDec(data.estimateCost)}`, margin, y);
    y += 16;
    doc.text(`CONTRACT VALUE: ${fmt(data.contractValue)}`, margin, y);
    y += 16;
    doc.text(`RETURN ON ESTIMATING INVESTMENT: ${Math.round(data.returnOnEstimate)}×`, margin, y);
  }

  // Confidential footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('OCD Internal Document — Not for Client Distribution', margin, pageH - 40);

  pageNum++;

  // ===== PAGE 2: EXECUTIVE SUMMARY =====
  newPage();
  let ey = 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('EXECUTIVE SUMMARY', margin, ey);
  doc.setFillColor(...GOLD);
  doc.rect(margin, ey + 6, 60, 2, 'F');
  ey += 30;

  const activeTrades = data.trades.filter(t => t.isActive);
  const totalBuildCost = activeTrades.reduce((s, t) => s + t.totalExtCost, 0);
  const totalProfit = activeTrades.reduce((s, t) => s + t.totalProfit, 0);
  const totalContractPrice = totalBuildCost + totalProfit;
  const grossMargin = totalContractPrice > 0 ? (totalProfit / totalContractPrice) * 100 : 0;
  const costPerSF = data.totalSqFt > 0 ? totalContractPrice / data.totalSqFt : 0;
  const totalDuration = Math.max(...activeTrades.map(t => t.scheduleDurationDays), 0);

  // Two-column summary box
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(margin, ey, contentW, 90, 4, 4, 'F');

  const colL = margin + 16;
  const colR = margin + contentW / 2 + 16;
  let sy = ey + 20;

  const summaryLine = (x: number, label: string, value: string, bold = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, sy);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...NAVY);
    doc.text(value, x + 130, sy);
  };

  summaryLine(colL, 'Total Build Cost:', fmt(totalBuildCost));
  summaryLine(colR, 'Gross Margin:', `${grossMargin.toFixed(1)}%`);
  sy += 18;
  summaryLine(colL, 'Total Profit:', fmt(totalProfit));
  summaryLine(colR, 'Cost per SF:', `$${costPerSF.toFixed(0)}/SF`);
  sy += 18;
  summaryLine(colL, 'Contract Price:', fmt(totalContractPrice), true);
  sy += 18;

  ey = sy + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(`Active Trades: ${activeTrades.length} of 38   |   Duration: ${totalDuration} working days`, margin, ey);
  ey += 14;
  doc.text(`Start: ${data.projectStartDate || '—'}`, margin, ey);

  // Profit by cost type
  ey += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('PROFIT BY COST TYPE', margin, ey);
  doc.setFillColor(...GOLD);
  doc.rect(margin, ey + 4, 40, 2, 'F');
  ey += 20;

  const costTypes = [
    { label: 'Labor', val: activeTrades.reduce((s, t) => s + t.totalLaborCost, 0) },
    { label: 'Materials', val: activeTrades.reduce((s, t) => s + t.totalMaterialsCost, 0) },
    { label: 'Subcontract', val: activeTrades.reduce((s, t) => s + t.totalSubcontractCost, 0) },
    { label: 'Equipment', val: activeTrades.reduce((s, t) => s + t.totalEquipmentCost, 0) },
    { label: 'Other', val: activeTrades.reduce((s, t) => s + t.totalOtherCost, 0) },
  ];
  const maxCostType = Math.max(...costTypes.map(c => c.val), 1);

  costTypes.forEach(ct => {
    const pct = totalBuildCost > 0 ? (ct.val / totalBuildCost) * 100 : 0;
    const barW = (ct.val / maxCostType) * (contentW - 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(ct.label, margin, ey + 3);
    doc.text(`${fmt(ct.val)}  (${pct.toFixed(0)}%)`, margin + 70, ey + 3);
    doc.setFillColor(...GOLD);
    doc.rect(margin + 180, ey - 4, Math.max(barW, 2), 10, 'F');
    ey += 18;
  });

  addFooter();

  // ===== PAGES 3+: TRADE-BY-TRADE =====
  activeTrades.sort((a, b) => a.sortOrder - b.sortOrder);

  activeTrades.forEach(trade => {
    newPage();
    let ty = 55;

    // Trade header bar
    doc.setFillColor(...NAVY);
    doc.rect(margin, ty, contentW, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text(`${trade.tradeGroup}`, margin + 8, ty + 16);
    doc.text(`Trade Total: ${fmt(trade.totalPrice)}`, margin + contentW - 8, ty + 16, { align: 'right' });
    ty += 36;

    // Trade summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Labor Hours: ${trade.totalLaborHours.toFixed(0)}h  |  Team: ${trade.teamSize}  |  Duration: ${trade.scheduleDurationDays}d  |  ` +
      `Labor: ${fmt(trade.totalLaborCost)}  |  Materials: ${fmt(trade.totalMaterialsCost)}  |  Sub: ${fmt(trade.totalSubcontractCost)}  |  Total: ${fmt(trade.totalExtCost)}`,
      margin, ty
    );
    ty += 12;

    if (trade.inspectionRequired) {
      doc.setFillColor(...GOLD);
      doc.roundedRect(margin, ty, 80, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      doc.text(`INSP: ${trade.inspectionType}`, margin + 40, ty + 10, { align: 'center' });
      ty += 20;
    }

    ty += 8;

    // Line items table
    if (trade.lineItems.length > 0) {
      autoTable(doc, {
        startY: ty,
        margin: { left: margin, right: margin },
        head: [['#', 'Description', 'Qty', 'Unit', 'Unit Cost', 'Ext Cost', 'Type']],
        body: trade.lineItems.map((item, idx) => [
          idx + 1,
          item.description || '—',
          item.quantity.toFixed(1),
          item.unit,
          fmtDec(item.unitCost),
          fmt(item.extCost),
          item.costType,
        ]),
        headStyles: {
          fillColor: GOLD as any,
          textColor: NAVY as any,
          fontStyle: 'bold',
          fontSize: 7,
        },
        bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 180 },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40 },
          4: { cellWidth: 55, halign: 'right' },
          5: { cellWidth: 55, halign: 'right' },
          6: { cellWidth: 50 },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || ty + 40;

      // Trade totals
      let fy = finalY + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const rightX = margin + contentW;
      doc.text(`Trade Ext Cost:`, rightX - 120, fy);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(trade.totalExtCost), rightX, fy, { align: 'right' });
      fy += 14;
      doc.setFont('helvetica', 'normal');
      const profitPct = trade.totalExtCost > 0 ? (trade.totalProfit / trade.totalExtCost * 100).toFixed(0) : '0';
      doc.text(`Trade Profit (${profitPct}%):`, rightX - 120, fy);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(trade.totalProfit), rightX, fy, { align: 'right' });
      fy += 14;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(`Trade Contract Price:`, rightX - 120, fy);
      doc.text(fmt(trade.totalPrice), rightX, fy, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No line items entered for this trade.', margin, ty);
    }

    addFooter();
  });

  // ===== FINAL PAGE: SCHEDULE + SIGNATURES =====
  newPage();
  let fy = 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('SCHEDULE SUMMARY', margin, fy);
  doc.setFillColor(...GOLD);
  doc.rect(margin, fy + 5, 40, 2, 'F');
  fy += 25;

  // Schedule table
  const schedRows = activeTrades.map((t, i) => [
    `${t.sortOrder}`,
    t.tradeName,
    `${t.scheduleDurationDays}d`,
    t.inspectionRequired ? t.inspectionType : '—',
  ]);

  autoTable(doc, {
    startY: fy,
    margin: { left: margin, right: margin },
    head: [['WBS', 'Trade', 'Days', 'Inspection']],
    body: schedRows,
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  const schedFinalY = (doc as any).lastAutoTable?.finalY || fy + 100;

  // Signature block
  let sigY = Math.max(schedFinalY + 40, pageH - 180);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('APPROVALS', margin, sigY);
  doc.setFillColor(...GOLD);
  doc.rect(margin, sigY + 4, 30, 2, 'F');
  sigY += 30;

  const sigLine = (label: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}: `, margin, sigY);
    doc.setDrawColor(150, 150, 150);
    doc.line(margin + 80, sigY, margin + 280, sigY);
    doc.text('Date: ', margin + 300, sigY);
    doc.line(margin + 330, sigY, margin + 430, sigY);
    sigY += 28;
  };

  sigLine('Prepared by');
  sigLine('Reviewed by');
  sigLine('Approved by');

  addFooter();

  doc.save(`${data.estimateNumber}_Takeoff.pdf`);
};

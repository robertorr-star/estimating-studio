export interface EstimateProject {
  id: string;
  estimateNumber: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'signed' | 'converted_to_project';
  projectName: string;
  projectAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectType: string;
  totalSqFt: number;
  projectStartDate: string;
  estimatedDurationDays: number;
  estimatedEndDate: string;
  totalBuildCost: number;
  totalProfit: number;
  grossMarginPct: number;
  totalContractPrice: number;
  costPerSqft: number;
  materialTaxRate: number;
  createdBy: string;
  reviewedBy: string;
  approvedBy: string;
  notes: string;
  internalNotes: string;
  createdAt: string;
}

export interface EstimateTrade {
  id: string;
  estimateId: string;
  tradeGroup: string;
  tradeName: string;
  sortOrder: number;
  isActive: boolean;
  totalLaborHours: number;
  totalLaborCost: number;
  totalMaterialsCost: number;
  totalSubcontractCost: number;
  totalEquipmentCost: number;
  totalOtherCost: number;
  totalExtCost: number;
  totalProfit: number;
  totalPrice: number;
  scheduleDurationDays: number;
  teamSize: number;
  inspectionRequired: boolean;
  inspectionType: string;
  lineItems: EstimateLineItem[];
}

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  tradeId: string;
  itemNumber: number;
  accountCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extCost: number;
  costType: string;
  profitPct: number;
  profitAmount: number;
  lineTotal: number;
  materialTaxApplied: boolean;
  notes: string;
  sortOrder: number;
  subcontractorName?: string;
  subDurationDays?: number;
}

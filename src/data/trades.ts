export interface TradeDefinition {
  sortOrder: number;
  tradeGroup: string;
  tradeName: string;
  predecessorSort: number | null;
  inspectionRequired: boolean;
  inspectionType: string;
  defaultTeamSize: number;
  relationshipType: 'FS' | 'SS' | 'SS+LAG' | 'FS+LAG';
  lagDays: number;
}

export const DEFAULT_TRADES: TradeDefinition[] = [
  { sortOrder: 1, tradeGroup: '01 Plans & Permits', tradeName: 'Plans & Permits', predecessorSort: null, inspectionRequired: false, inspectionType: '', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 2, tradeGroup: '02 Mobilization', tradeName: 'Mobilization', predecessorSort: 1, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 3, tradeGroup: '03 Demo & Prep', tradeName: 'Demo & Prep', predecessorSort: 2, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 4, tradeGroup: '04 Excavation', tradeName: 'Excavation', predecessorSort: 3, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 5, tradeGroup: '05 Footings', tradeName: 'Footings', predecessorSort: 4, inspectionRequired: true, inspectionType: 'Footings', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 6, tradeGroup: '06 Foundation', tradeName: 'Foundation', predecessorSort: 5, inspectionRequired: true, inspectionType: 'Foundation', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 7, tradeGroup: '07 Plumbing Underground', tradeName: 'Plumbing Underground', predecessorSort: 6, inspectionRequired: true, inspectionType: 'Underground', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 8, tradeGroup: '08 Concrete', tradeName: 'Concrete', predecessorSort: 7, inspectionRequired: false, inspectionType: '', defaultTeamSize: 3, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 9, tradeGroup: '09 Framing', tradeName: 'Framing', predecessorSort: 8, inspectionRequired: true, inspectionType: 'Framing Rough', defaultTeamSize: 4, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 10, tradeGroup: '10 Roofing', tradeName: 'Roofing', predecessorSort: 9, inspectionRequired: false, inspectionType: '', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 11, tradeGroup: '11 Plumbing Rough', tradeName: 'Plumbing Rough', predecessorSort: 9, inspectionRequired: true, inspectionType: 'Plumbing Rough', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 12, tradeGroup: '12 Electrical Rough', tradeName: 'Electrical Rough', predecessorSort: 9, inspectionRequired: true, inspectionType: 'Electrical Rough', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 13, tradeGroup: '13 HVAC Rough', tradeName: 'HVAC Rough', predecessorSort: 9, inspectionRequired: true, inspectionType: 'HVAC Rough', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 14, tradeGroup: '14 Insulation', tradeName: 'Insulation', predecessorSort: 13, inspectionRequired: true, inspectionType: 'Insulation', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 15, tradeGroup: '15 Drywall', tradeName: 'Drywall', predecessorSort: 14, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 16, tradeGroup: '16 Stucco', tradeName: 'Stucco', predecessorSort: 9, inspectionRequired: false, inspectionType: '', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 17, tradeGroup: '17 Interior Paint', tradeName: 'Interior Paint', predecessorSort: 15, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 18, tradeGroup: '18 Exterior Paint', tradeName: 'Exterior Paint', predecessorSort: 16, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 19, tradeGroup: '19 Cabinets', tradeName: 'Cabinets', predecessorSort: 17, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 20, tradeGroup: '20 Counter Tops', tradeName: 'Counter Tops', predecessorSort: 19, inspectionRequired: false, inspectionType: '', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 21, tradeGroup: '21 Tile', tradeName: 'Tile', predecessorSort: 19, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 22, tradeGroup: '22 Flooring', tradeName: 'Flooring', predecessorSort: 21, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 23, tradeGroup: '23 Interior Trim', tradeName: 'Interior Trim', predecessorSort: 22, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 24, tradeGroup: '24 Exterior Trim', tradeName: 'Exterior Trim', predecessorSort: 18, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 25, tradeGroup: '25 Doors', tradeName: 'Doors', predecessorSort: 23, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 26, tradeGroup: '26 Windows', tradeName: 'Windows', predecessorSort: 9, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 27, tradeGroup: '27 HVAC Finish', tradeName: 'HVAC Finish', predecessorSort: 23, inspectionRequired: true, inspectionType: 'HVAC Final', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 28, tradeGroup: '28 Plumbing Finish', tradeName: 'Plumbing Finish', predecessorSort: 23, inspectionRequired: true, inspectionType: 'Plumbing Final', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 29, tradeGroup: '29 Electrical Finish', tradeName: 'Electrical Finish', predecessorSort: 23, inspectionRequired: true, inspectionType: 'Electrical Final', defaultTeamSize: 1, relationshipType: 'SS', lagDays: 0 },
  { sortOrder: 30, tradeGroup: '30 Appliances', tradeName: 'Appliances', predecessorSort: 28, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 31, tradeGroup: '31 Masonry', tradeName: 'Masonry', predecessorSort: 6, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 32, tradeGroup: '32 Decking', tradeName: 'Decking', predecessorSort: 9, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 33, tradeGroup: '33 Fencing', tradeName: 'Fencing', predecessorSort: 6, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 34, tradeGroup: '34 Landscape', tradeName: 'Landscape', predecessorSort: 8, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 35, tradeGroup: '35 Rain Gutters', tradeName: 'Rain Gutters', predecessorSort: 10, inspectionRequired: false, inspectionType: '', defaultTeamSize: 1, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 36, tradeGroup: '36 Stairs', tradeName: 'Stairs', predecessorSort: 9, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 37, tradeGroup: '37 Clean Up', tradeName: 'Clean Up', predecessorSort: 30, inspectionRequired: false, inspectionType: '', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
  { sortOrder: 38, tradeGroup: '38 Punch List', tradeName: 'Punch List', predecessorSort: 37, inspectionRequired: true, inspectionType: 'Final', defaultTeamSize: 2, relationshipType: 'FS', lagDays: 0 },
];

export const TEAM_RATES: Record<number, number> = {
  1: 56,
  2: 99,
  3: 152,
  4: 191,
};

export const DEFAULT_PROFIT_MARGINS: Record<string, number> = {
  'Labor': 0.15,
  'Materials': 0.28,
  'Subcontract': 0.30,
  'Equipment': 0.15,
  'Other': 0.28,
  'Design/Permit': 0.28,
  '--': 0,
};

export const PROJECT_TYPES = [
  'Addition', 'ADU', 'Remodel', 'New Construction', 'Commercial', 'Other'
];

export const UNITS = ['hours', 'each', 'sf.', 'lf.', 'sq. yd.', 'lot', 'pcs', 'roll', 'box', 'bag', 'ton', 'yard', 'pail', 'set', 'pack', 'day'];

export const COST_TYPES = ['Labor', 'Materials', 'Subcontract', 'Equipment', 'Other', 'Design/Permit', '--'];

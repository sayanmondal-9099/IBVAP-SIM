export interface OperatorProfile {
  name: string;
  role: string;
  badgeId: string;
  clearance: string;
  sector: string;
  shift: string;
}

export const DEFAULT_OPERATOR: OperatorProfile = {
  name: "S. Rao",
  role: "Site Operator",
  badgeId: "IBVAP-OP-01",
  clearance: "LEVEL 3 (SIMULATION TAC-OPS)",
  sector: "Sector Alpha (Post 10-14)",
  shift: "Alpha Watch (0800 - 1600 IST)",
};

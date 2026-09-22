export type TacticalObjectType = 
  | "drone" 
  | "helicopter" 
  | "aircraft" 
  | "unknown aerial object" 
  | "tank" 
  | "truck" 
  | "vehicle" 
  | "person" 
  | "bird" 
  | string;

export function getTacticalCategory(objectType: string, objectId: string = ""): "drone" | "stealth" | "tank" | "truck" | "infantry" | "person" | "bird" | "anomaly" | "unknown" {
  const t = (objectType || "").toLowerCase();
  const id = (objectId || "").toLowerCase();

  if (id.includes("tank") || t === "tank") return "tank";
  if (t.includes("stealth") || t.includes("bogey") || id.includes("bogey") || id.includes("stealth") || t.includes("unknown aerial")) return "stealth";
  if (t.includes("anomaly") || id.includes("anomaly") || t.includes("diamond")) return "anomaly";
  if (t === "drone" || id.includes("drone") || t.includes("quadcopter")) return "drone";
  if (t === "truck" || id.includes("convoy") || id.includes("truck") || t === "vehicle" || id.includes("pickup") || id.includes("car")) return "truck";
  if (id.includes("troop") || id.includes("squad") || id.includes("infiltrat") || id.includes("platoon")) return "infantry";
  if (t === "person" || id.includes("herder") || id.includes("civilian") || id.includes("person") || t.includes("operative")) return "person";
  if (t === "bird") return "bird";
  
  return "unknown";
}

export function isPriorityThreat(category: string, objectType: string = "", objectId: string = ""): boolean {
  const cat = category.toLowerCase();
  const t = (objectType || "").toLowerCase();
  const id = (objectId || "").toLowerCase();
  return (
    cat === "tank" ||
    cat === "stealth" ||
    cat === "anomaly" ||
    t.includes("tank") ||
    t.includes("stealth") ||
    t.includes("bogey") ||
    t.includes("anomaly") ||
    id.includes("tank") ||
    id.includes("stealth") ||
    id.includes("bogey") ||
    id.includes("anomaly")
  );
}

export function getTacticalColor(category: string, isAlert: boolean = false, isSelected: boolean = false): string {
  if (isSelected) return "#FFFFFF";
  if (isAlert) return "#F07576";
  switch (category) {
    case "drone":
      return "#48D3D2"; // Cyan for Quadcopter UAV (matches legend)
    case "stealth":
      return "#48D3D2"; // Cyan for Stealth / Aerial Bogey (matches legend)
    case "tank":
      return "#AD91FF"; // Violet for Heavy Tank (matches legend)
    case "truck":
      return "#AD91FF"; // Violet for Military Convoy / Truck (matches legend)
    case "infantry":
      return "#F4B65A"; // Amber for Troop Infiltrator Squad (matches legend)
    case "person":
      return "#6ED694"; // Green for Personnel / Civilian (matches legend)
    case "bird":
      return "#758890"; // Neutral gray for Avian Wildlife (matches legend)
    case "anomaly":
      return "#AD91FF"; // Violet for Anomaly
    default:
      return "#F4B65A";
  }
}

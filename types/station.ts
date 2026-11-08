export const FUEL_OPTIONS = ["Gazole", "SP95", "SP98", "E10", "E85", "GPLc"] as const;
export type Fuel = typeof FUEL_OPTIONS[number];
export type Station = { id:string; name:string; brand:string; city:string; region:string; department:string; postalCode:string; address:string; latitude:number; longitude:number; fuelAvailable:string[]; prices:Record<Fuel,number|null>; shortage:string[]; automate24h:boolean; updatedAt:string|null; services:string[] };

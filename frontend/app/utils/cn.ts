import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// to resolve tailwin class conflicts
//example: if an element have cn("bg-red-500", "bg-blue-500") > "bg-blue-500" is applied
// last class will be applied
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

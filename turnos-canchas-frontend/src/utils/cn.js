import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs) { return twMerge(clsx(inputs)) }
// Fallback sin tailwind-merge si no hay conflictos de clases: clsx es suficiente.
// Para este proyecto puro CSS, cn es alias de clsx.
export function cx(...cls) { return clsx(cls) }

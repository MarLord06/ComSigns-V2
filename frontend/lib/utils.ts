import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número decimal a un número específico de decimales
 * @param num - El número a formatear
 * @param decimals - El número de decimales (por defecto 2)
 * @returns El número formateado como número
 */
export function formatDecimal(num: number, decimals: number = 2): number {
  return Number(num.toFixed(decimals));
}

/**
 * Formatea un porcentaje a un número específico de decimales
 * @param value - El valor (0-1 o 0-100)
 * @param decimals - El número de decimales (por defecto 2)
 * @param isAlreadyPercentage - Si el valor ya está en formato porcentaje (por defecto false)
 * @returns El porcentaje formateado como string con símbolo %
 */
export function formatPercentage(value: number, decimals: number = 2, isAlreadyPercentage: boolean = false): string {
  const percentValue = isAlreadyPercentage ? value : value * 100;
  return `${formatDecimal(percentValue, decimals)}%`;
}

/**
 * Formatea un número de confianza (0-1) a porcentaje
 * @param confidence - El valor de confianza (0-1)
 * @param decimals - El número de decimales (por defecto 2)
 * @returns El porcentaje formateado como string con símbolo %
 */
export function formatConfidence(confidence: number, decimals: number = 2): string {
  return formatPercentage(confidence, decimals, false);
}

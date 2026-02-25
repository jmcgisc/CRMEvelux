/**
 * ─────────────────────────────────────────────────────────
 *  Evelux Rewards – Constantes y utilidades globales
 * ─────────────────────────────────────────────────────────
 *
 *  Esquema:
 *    · 10 puntos = $1 MXN  →  VALOR_PUNTO = $0.10 por punto
 *    · Se otorga el 0.5% de la venta total en valor MXN
 *      convertido a puntos.
 *
 *  Ejemplo:
 *    Venta $10,000 → 0.5% = $50 → 50 / 0.10 = 500 puntos
 */

/** Valor en MXN de cada punto al canjear (10 pts = $1 MXN) */
export const VALOR_PUNTO = 0.10;

/** Porcentaje de la venta que se convierte en valor de puntos (0.5%) */
export const PORCENTAJE_ACUMULACION = 0.005;

/**
 * Calcula los puntos que se otorgan por una venta.
 * @param {number} montoTotal – Importe final de la venta en MXN
 * @returns {number} Puntos enteros a acreditar al cliente
 */
export const calcularPuntosGanados = (montoTotal) =>
    Math.floor((Number(montoTotal) * PORCENTAJE_ACUMULACION) / VALOR_PUNTO);

/**
 * Calcula el descuento en MXN dado un número de puntos a canjear.
 * @param {number} puntos
 * @returns {number} Monto de descuento en MXN
 */
export const calcularDescuentoPuntos = (puntos) =>
    Number(puntos) * VALOR_PUNTO;

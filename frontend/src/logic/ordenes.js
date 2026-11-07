/*
 * Reglas de las ordenes de compra (totales, numeracion y acceso), sin DOM ni
 * almacenamiento.
 */

// Los precios del sitio incluyen IVA (19 %).
export const TASA_IVA = 0.19;

export const subtotalItems = (items) => items.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0);

/** Neto e IVA contenidos en un total con IVA incluido; neto + IVA es siempre el total. */
export function desgloseIva(total) {
	const neto = Math.round(total / (1 + TASA_IVA));
	return { neto, iva: total - neto };
}

/**
 * Numero de la proxima orden: ORD-AAAA-NNNN, correlativo dentro del ano de la
 * fecha (AAAA-MM-DD). Los numeros que no siguen el formato se ignoran.
 */
export function siguienteNumero(ordenes, fecha) {
	const ano = String(fecha).slice(0, 4);
	const formato = new RegExp(`^ORD-${ano}-(\\d+)$`);
	const ultimo = ordenes.reduce((mayor, orden) => {
		const coincidencia = formato.exec(orden.numero);
		return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
	}, 0);
	return `ORD-${ano}-${String(ultimo + 1).padStart(4, "0")}`;
}

/**
 * Quien puede ver una orden. El personal (administrador y logistico) ve todas y
 * un cliente solo las suyas. La orden de un invitado no tiene dueno y se ve
 * con su enlace: sin backend no hay como autenticarlo.
 */
export function puedeVerOrden(orden, sesion) {
	if (!orden) return false;
	if (sesion && ["ADMIN", "LOGISTICA"].includes(sesion.rol)) return true;
	if (!orden.cliente) return true;
	return Boolean(sesion) && sesion.run === orden.cliente;
}

/** Copia de las ordenes de la mas reciente a la mas antigua (fecha y, a igualdad, numero). */
export const masRecientesPrimero = (ordenes) =>
	[...ordenes].sort(
		(a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero, undefined, { numeric: true }),
	);

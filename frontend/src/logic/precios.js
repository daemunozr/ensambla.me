/*
 * Precio de oferta de un producto, sin DOM ni almacenamiento.
 *
 * Producto.descuento es un porcentaje entero entre 0 y 90; vacio o ausente
 * significa sin oferta. El precio que se cobra, se muestra y se guarda en las
 * ordenes es siempre el vigente.
 */
export const MAXIMO_DESCUENTO = 90;

/** Porcentaje de descuento aplicable: 0 si esta vacio o es invalido, y nunca mas que el maximo. */
export function porcentajeDescuento(producto) {
	const porcentaje = Math.trunc(Number(producto?.descuento));
	if (!Number.isFinite(porcentaje) || porcentaje <= 0) return 0;
	return Math.min(porcentaje, MAXIMO_DESCUENTO);
}

export const enOferta = (producto) => porcentajeDescuento(producto) > 0;

/** Precio con el descuento aplicado, en pesos enteros; sin oferta es el precio de lista. */
export function precioVigente(producto) {
	const lista = Number(producto?.precio) || 0;
	const porcentaje = porcentajeDescuento(producto);
	return porcentaje ? Math.round((lista * (100 - porcentaje)) / 100) : lista;
}

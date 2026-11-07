/** Un producto esta en stock critico cuando su stock no supera el umbral (RF-10 CA4). */
export const enStockCritico = (producto) =>
	producto.stockCritico !== "" &&
	producto.stockCritico !== null &&
	producto.stockCritico !== undefined &&
	Number(producto.stock) <= Number(producto.stockCritico);

/** Unidades que faltan para volver al umbral critico (negativo si hay de sobra). */
export const faltante = (producto) => Number(producto.stockCritico) - Number(producto.stock);

/**
 * Productos en stock critico, del mas urgente al menos: primero los agotados,
 * luego los de mayor faltante y, a igualdad, por SKU. No modifica la lista recibida.
 */
export const productosCriticos = (productos) =>
	productos
		.filter(enStockCritico)
		.sort(
			(a, b) =>
				Number(Number(a.stock) > 0) - Number(Number(b.stock) > 0) ||
				faltante(b) - faltante(a) ||
				a.sku.localeCompare(b.sku),
		);

/*
 * Reglas del pago de una compra (opciones de entrega, envio y armado de los
 * items de la orden), sin DOM ni almacenamiento.
 *
 * Estas funciones reciben como parametro como buscar un producto por SKU y no
 * importan data/datos.js: datos.js las usa en crearOrden y un import en el otro
 * sentido seria circular.
 */
import { precioVigente } from "./precios.js";

/**
 * Entregas disponibles. "gratisDesde" es el subtotal desde el cual el envio no
 * se cobra; null si el costo siempre se aplica.
 */
export const OPCIONES_ENTREGA = [
	{ codigo: "DOMICILIO", nombre: "Despacho a domicilio", costo: 4990, gratisDesde: 200000 },
	{ codigo: "RETIRO", nombre: "Retiro en tienda", costo: 0, gratisDesde: null },
];

export const entregaDe = (codigo) => OPCIONES_ENTREGA.find((opcion) => opcion.codigo === codigo);

/** Costo de envio de una entrega para un subtotal; una entrega desconocida no cuesta nada. */
export function costoEnvio(codigo, subtotal) {
	const opcion = entregaDe(codigo);
	if (!opcion) return 0;
	if (opcion.gratisDesde !== null && subtotal >= opcion.gratisDesde) return 0;
	return opcion.costo;
}

/**
 * Items de la orden a partir de las lineas del carrito: una por SKU, porque la
 * clave de un item es (orden, producto) y un armado y una linea suelta pueden
 * traer el mismo producto. El precio es el vigente (con la oferta aplicada).
 */
export function consolidar(lineas, buscar) {
	const items = new Map();
	lineas.forEach((linea) => {
		const cantidad = Math.max(0, Math.trunc(Number(linea.cantidad)) || 0);
		const existente = items.get(linea.producto);
		if (existente) existente.cantidad += cantidad;
		else items.set(linea.producto, { producto: linea.producto, cantidad, precioUnitario: precioVigente(buscar(linea.producto)) });
	});
	return [...items.values()];
}

/**
 * Descripcion de cada item que no se puede vender: el producto ya no esta en el
 * catalogo, no tiene stock o tiene menos de lo pedido. Vacio si todo alcanza.
 */
export function faltantes(items, buscar) {
	return items.flatMap(({ producto: sku, cantidad }) => {
		const producto = buscar(sku);
		if (!producto) return [`${sku} (ya no esta en el catalogo)`];
		const stock = Number(producto.stock) || 0;
		if (stock <= 0) return [`${producto.nombre} (sin stock)`];
		return stock < cantidad ? [`${producto.nombre} (quedan ${stock})`] : [];
	});
}

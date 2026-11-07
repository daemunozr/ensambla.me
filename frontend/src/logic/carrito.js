/*
 * Reglas del carrito de compras (RF-05, RF-06, RF-07), sin DOM ni almacenamiento.
 *
 * Una linea es { linea, producto, cantidad, armado }: armado es el agrupador
 * compartido por las lineas de un mismo armado, o null en una linea suelta.
 * Las unidades de un producto en el carrito, sumando sus lineas sueltas y las
 * de cualquier armado, nunca superan su stock.
 *
 * Cada funcion recibe como ultimo parametro como buscar un producto por SKU,
 * para poder probarlas con un catalogo propio.
 */
import { producto as productoDelCatalogo } from "../data/datos.js";
import { unidades } from "../utils/formato.js";
import { precioVigente } from "./precios.js";

const numerar = (lineas) => lineas.map((linea, i) => ({ ...linea, linea: i + 1 }));

/**
 * Limpia un carrito leido del almacenamiento: descarta lineas mal formadas o de
 * productos que ya no existen, y ajusta cada cantidad al stock vigente. La
 * linea que ya no tiene unidades disponibles se quita (RF-06 CA4).
 */
export function normalizar(lineas, buscar = productoDelCatalogo) {
	if (!Array.isArray(lineas)) throw new Error("el carrito no es un arreglo");

	const ocupadas = {};
	return numerar(
		lineas
			.filter((linea) => linea && typeof linea.producto === "string" && buscar(linea.producto))
			.map((linea) => {
				const stock = Number(buscar(linea.producto).stock) || 0;
				const libres = Math.max(0, stock - (ocupadas[linea.producto] ?? 0));
				const cantidad = Math.min(Math.max(1, Math.trunc(Number(linea.cantidad)) || 1), libres);
				ocupadas[linea.producto] = (ocupadas[linea.producto] ?? 0) + cantidad;
				return { producto: linea.producto, cantidad, armado: linea.armado || null };
			})
			.filter((linea) => linea.cantidad > 0),
	);
}

/* ------------------------------------------------------------------ Consultas */
export const cantidadItems = (lineas) => lineas.reduce((total, linea) => total + linea.cantidad, 0);

/** Precio vigente (con la oferta aplicada) por la cantidad de la linea. */
export const subtotal = (linea, buscar = productoDelCatalogo) =>
	precioVigente(buscar(linea.producto)) * linea.cantidad;

export const total = (lineas, buscar = productoDelCatalogo) =>
	lineas.reduce((suma, linea) => suma + subtotal(linea, buscar), 0);

/** Unidades del producto en el carrito, sin contar la linea indicada. */
export const unidadesEnCarrito = (lineas, sku, excluirLinea = null) =>
	lineas
		.filter((linea) => linea.producto === sku && linea.linea !== excluirLinea)
		.reduce((suma, linea) => suma + linea.cantidad, 0);

/** Unidades que todavia pueden agregarse sin superar el stock. */
export function disponible(lineas, sku, excluirLinea = null, buscar = productoDelCatalogo) {
	const stock = Number(buscar(sku)?.stock) || 0;
	return Math.max(0, stock - unidadesEnCarrito(lineas, sku, excluirLinea));
}

/** Agrupa las lineas: las sueltas y un objeto { agrupador: lineas } con los armados. */
export function agrupar(lineas) {
	const sueltas = lineas.filter((linea) => !linea.armado);
	const armados = {};
	lineas
		.filter((linea) => linea.armado)
		.forEach((linea) => {
			(armados[linea.armado] ??= []).push(linea);
		});
	return { sueltas, armados };
}

/* ---------------------------------------------------------------- Operaciones
   Devuelven { ok, lineas, mensaje }: si ok es false, lineas no cambia. */

/** Agrega un producto; si ya esta suelto en el carrito, suma su cantidad (RF-05 CA2). */
export function agregarProducto(lineas, sku, cantidad = 1, buscar = productoDelCatalogo) {
	const producto = buscar(sku);
	if (!producto) return { ok: false, lineas, mensaje: `No existe el producto "${sku}".` };

	if (Number(producto.stock) <= 0) {
		return { ok: false, lineas, mensaje: `"${producto.nombre}" no tiene stock disponible.` };
	}

	const libres = disponible(lineas, sku, null, buscar);
	if (cantidad > libres) {
		const enCarrito = unidadesEnCarrito(lineas, sku);
		return {
			ok: false,
			lineas,
			mensaje:
				libres === 0
					? `Ya tienes en el carrito todo el stock de "${producto.nombre}" (${unidades(enCarrito)}).`
					: `Solo ${libres === 1 ? "queda" : "quedan"} ${unidades(libres)} de "${producto.nombre}" y ya tienes ${enCarrito} en el carrito.`,
		};
	}

	const existente = lineas.find((linea) => linea.producto === sku && !linea.armado);
	const nuevas = existente
		? lineas.map((linea) => (linea === existente ? { ...linea, cantidad: linea.cantidad + cantidad } : linea))
		: [...lineas, { linea: lineas.length + 1, producto: sku, cantidad, armado: null }];

	return { ok: true, lineas: numerar(nuevas), mensaje: `"${producto.nombre}" se agrego al carrito.` };
}

/**
 * Agrega un armado: una linea por componente con el mismo agrupador (RF-07).
 * Si algun componente no tiene stock disponible, no se agrega nada (RF-07 CA7).
 */
export function agregarArmado(lineas, skus, agrupador, buscar = productoDelCatalogo) {
	if (!skus.length) return { ok: false, lineas, mensaje: "El armado no tiene componentes." };

	const nuevas = [...lineas];
	const sinStock = [];

	// Cada componente se suma antes de revisar el siguiente, asi un producto
	// repetido en el armado tambien cuenta contra su stock.
	skus.forEach((sku) => {
		const producto = buscar(sku);
		if (!producto) return;
		if (disponible(nuevas, sku, null, buscar) < 1) {
			sinStock.push(producto.nombre);
			return;
		}
		nuevas.push({ linea: nuevas.length + 1, producto: sku, cantidad: 1, armado: agrupador });
	});

	if (sinStock.length) {
		return { ok: false, lineas, mensaje: `Sin stock suficiente para: ${sinStock.join(", ")}. El armado no se agrego.` };
	}

	return {
		ok: true,
		lineas: numerar(nuevas),
		mensaje: `Armado agregado al carrito con ${skus.length} ${skus.length === 1 ? "componente" : "componentes"}.`,
	};
}

/** Cambia la cantidad de una linea; nunca por debajo de 1 ni por sobre el stock (RF-06 CA3). */
export function cambiarCantidad(lineas, numero, cantidad, buscar = productoDelCatalogo) {
	const linea = lineas.find((l) => l.linea === numero);
	if (!linea) return { ok: false, lineas, mensaje: "" };

	const pedida = Math.max(1, Math.trunc(Number(cantidad)) || 1);
	const tope = Math.max(1, disponible(lineas, linea.producto, numero, buscar));
	const mensaje = pedida > tope ? `Solo puedes llevar ${unidades(tope)} de "${buscar(linea.producto)?.nombre}".` : "";

	return {
		ok: true,
		lineas: lineas.map((l) => (l === linea ? { ...l, cantidad: Math.min(pedida, tope) } : l)),
		mensaje,
	};
}

export const eliminarLinea = (lineas, numero) => numerar(lineas.filter((linea) => linea.linea !== numero));

/** Carrito sin lineas (tras pagar la compra). */
export const vaciar = () => [];

export const eliminarArmado = (lineas, agrupador) => numerar(lineas.filter((linea) => linea.armado !== agrupador));

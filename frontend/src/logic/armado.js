/*
 * Asistente de armado de PC gamer (RF-07): estado y reglas, sin DOM.
 *
 * Las categorias se recorren en el orden definido en los datos, una a la vez.
 * Al escoger un componente, la categoria siguiente ofrece solo los admisibles
 * de la tabla de compatibilidad estatica: no hay calculo tecnico real.
 *
 * Dos modos: equipo completo (recorre todas las categorias) y por modulos
 * (permite omitir categorias y finalizar antes con lo ya seleccionado).
 */
import { admisibles as admisiblesDelCatalogo, productosDe as productosDelCatalogo } from "../data/datos.js";

/** Estado inicial para un recorrido de "total" categorias. */
export const estadoInicial = (total) => ({
	total,
	modo: null, // "completo" | "modulos"
	indice: 0,
	elecciones: [], // { categoria, sku } con sku = null cuando se omite
	agregado: false,
});

export function armadoReducer(estado, accion) {
	const avanzar = (elecciones) => ({ ...estado, elecciones, indice: Math.min(estado.indice + 1, estado.total) });

	switch (accion.tipo) {
		case "modo":
			return { ...estadoInicial(estado.total), modo: accion.modo };
		case "registrar": {
			// Cambiar un componente invalida lo elegido despues, que pudo filtrarse con el.
			const elecciones = estado.elecciones.slice(0, estado.indice);
			elecciones[estado.indice] = { categoria: accion.categoria, sku: accion.sku };
			return avanzar(elecciones);
		}
		case "omitir": {
			const elecciones = [...estado.elecciones];
			elecciones[estado.indice] = { categoria: accion.categoria, sku: null };
			return avanzar(elecciones);
		}
		case "volver":
			return { ...estado, indice: Math.max(0, estado.indice - 1) };
		case "finalizar":
			return { ...estado, indice: estado.total };
		case "seguir":
			return { ...estado, indice: estado.elecciones.length };
		case "agregado":
			return { ...estado, agregado: true };
		case "reiniciar":
			return estadoInicial(estado.total);
		default:
			return estado;
	}
}

/* ---------------------------------------------------------------- Consultas */
export const elegidos = (estado) => estado.elecciones.filter((eleccion) => eleccion?.sku);

export const recorridoCompleto = (estado) => estado.indice >= estado.total;

/**
 * Se puede agregar al carrito con al menos un componente: en modo modulos en
 * cualquier momento (RF-07 CA3) y en equipo completo solo al terminar (CA4).
 */
export const puedeAgregar = (estado) =>
	!estado.agregado && elegidos(estado).length > 0 && (estado.modo === "modulos" || recorridoCompleto(estado));

/**
 * Opciones de la categoria en la posicion "indice": se filtran con los
 * admisibles del componente escogido en la categoria anterior. Si esa
 * categoria se omitio, se ofrece la categoria completa.
 */
export function opcionesDe(
	estado,
	categorias,
	indice = estado.indice,
	productosDe = productosDelCatalogo,
	admisibles = admisiblesDelCatalogo,
) {
	const productos = productosDe(categorias[indice].codigo);
	const anterior = indice > 0 ? estado.elecciones[indice - 1] : null;
	if (!anterior?.sku) return productos;

	const permitidos = admisibles(anterior.sku);
	return productos.filter((producto) => permitidos.includes(producto.sku));
}

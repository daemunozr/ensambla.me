/*
 * Carrito de compras compartido por toda la app (RF-05, RF-06, RF-14 CA2).
 *
 * Se guarda en localStorage bajo la unica clave "carrito". Un contenido
 * invalido o corrupto deja el carrito vacio en lugar de interrumpir la
 * ejecucion (RNF-03 CA4). Las reglas viven en logic/carrito.js.
 */
import { createContext, useContext } from "react";
import { normalizar } from "../logic/carrito.js";

const CLAVE_CARRITO = "carrito";

export const CarritoContext = createContext(null);

export function leerCarrito() {
	try {
		const guardado = window.localStorage.getItem(CLAVE_CARRITO);
		return guardado ? normalizar(JSON.parse(guardado)) : [];
	} catch (error) {
		console.error("carrito: contenido invalido en localStorage, el carrito parte vacio", error);
		// Se descarta el contenido ilegible para no repetir el error en cada lectura.
		try {
			window.localStorage.removeItem(CLAVE_CARRITO);
		} catch (fallo) {
			console.error("carrito: tampoco se pudo limpiar la clave del carrito", fallo);
		}
		return [];
	}
}

export function guardarCarrito(lineas) {
	try {
		window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
	} catch (error) {
		console.error("carrito: no se pudo guardar el carrito", error);
	}
}

export function useCarrito() {
	const contexto = useContext(CarritoContext);
	if (!contexto) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
	return contexto;
}

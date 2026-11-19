/*
 * Sesion del usuario (RF-02, RF-13).
 *
 * La sesion vive en sessionStorage bajo la clave "sesion", junto con los tokens
 * JWT que entrega la API: recargar la pagina la mantiene y cerrar la pestana la
 * termina. Cerrar sesion NO toca el carrito, que se asocia al navegador y no al
 * usuario (RF-13 CA3).
 *
 * Forma: { accessToken, refreshToken, run, nombre, apellidos, correo, rol }.
 */
import { createContext, useContext } from "react";

export const CLAVE_SESION = "sesion";

export const SesionContext = createContext(null);

export function leerSesion() {
	try {
		const guardado = window.sessionStorage.getItem(CLAVE_SESION);
		if (!guardado) return null;
		const sesion = JSON.parse(guardado);
		return sesion?.run && sesion?.rol && sesion?.accessToken ? sesion : null;
	} catch (error) {
		console.error("sesion: datos de sesion invalidos, se considera sin sesion", error);
		return null;
	}
}

export function guardarSesion(sesion) {
	try {
		window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
	} catch (error) {
		console.error("sesion: no se pudo guardar la sesion", error);
	}
}

export function borrarSesion() {
	try {
		window.sessionStorage.removeItem(CLAVE_SESION);
	} catch (error) {
		console.error("sesion: no se pudo limpiar la sesion", error);
	}
}

/** Aviso de que la API rechazo los tokens y no se pudieron renovar: la sesion termino. */
export const EVENTO_SESION_EXPIRADA = "ensamblame:sesion-expirada";

/** Vista a la que llega cada rol al autenticarse (RF-02 CA1). */
export function inicioDeRol(rol) {
	if (rol === "ADMIN") return "/admin";
	if (rol === "LOGISTICA") return "/admin/productos";
	return "/";
}

/**
 * Solo se respeta un destino que sea una ruta de este mismo sitio. Se resuelve
 * como lo haria el navegador: "/\otro.com" o "/<tab>/otro.com" parecen rutas,
 * pero el navegador los convierte en "//otro.com" y lleva a otro sitio.
 */
export function destinoSeguro(pedido) {
	if (typeof pedido !== "string" || !pedido.startsWith("/")) return null;
	try {
		const url = new URL(pedido, window.location.origin);
		return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null;
	} catch {
		return null;
	}
}

export function useSesion() {
	const contexto = useContext(SesionContext);
	if (!contexto) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
	return contexto;
}

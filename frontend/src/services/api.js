/*
 * Cliente HTTP de la API REST (IE3.2.2). Todas las llamadas del frontend pasan
 * por peticion(): agrega el token de la sesion, renueva el token de acceso una
 * vez si la API responde 401 y devuelve siempre un resultado, nunca lanza:
 *
 *   { ok: true, estado, datos }
 *   { ok: false, estado, mensaje, errores }   (estado 0 si no hubo respuesta)
 *
 * La URL base sale de VITE_API_URL en el momento de compilar.
 */
import { EVENTO_SESION_EXPIRADA, borrarSesion, guardarSesion, leerSesion } from "../context/sesion.js";

export const URL_API = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");

const SIN_CONEXION = "No se pudo conectar con el servidor. Revisa que la API este en marcha e intenta de nuevo.";

const MENSAJE_POR_ESTADO = {
	401: "Tu sesion no es valida o vencio. Inicia sesion de nuevo.",
	403: "Tu rol no tiene permiso para hacer esto.",
};

const falla = (estado, mensaje, errores = null) => ({ ok: false, estado, mensaje, errores });

// Una sola renovacion a la vez: varias llamadas que fallan juntas comparten la misma.
let renovacion = null;

function renovar() {
	if (renovacion) return renovacion;
	const sesion = leerSesion();
	if (!sesion?.refreshToken) return Promise.resolve(false);

	const actual = fetch(`${URL_API}/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken: sesion.refreshToken }),
	})
		.then(async (respuesta) => {
			if (!respuesta.ok) return false;
			const tokens = await respuesta.json();
			guardarSesion({
				...leerSesion(),
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				rol: tokens.rol,
			});
			return true;
		})
		.catch(() => false)
		.finally(() => {
			if (renovacion === actual) renovacion = null;
		});
	renovacion = actual;
	return actual;
}

function terminarSesion() {
	borrarSesion();
	window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
}

function enviar(metodo, ruta, cuerpo) {
	const cabeceras = { Accept: "application/json" };
	if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
	const sesion = leerSesion();
	if (sesion) cabeceras.Authorization = `Bearer ${sesion.accessToken}`;
	return fetch(`${URL_API}${ruta}`, {
		method: metodo,
		headers: cabeceras,
		body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
	});
}

async function interpretar(respuesta) {
	let cuerpo = null;
	if (respuesta.status !== 204) cuerpo = await respuesta.json().catch(() => null);
	if (respuesta.ok) return { ok: true, estado: respuesta.status, datos: cuerpo };

	// Un 400 de validacion trae un mensaje por campo; se muestran todos juntos.
	const errores = cuerpo?.errores ?? null;
	const detalle = errores ? Object.values(errores).join(" ") : "";
	const mensaje =
		detalle || cuerpo?.mensaje || MENSAJE_POR_ESTADO[respuesta.status] || "El servidor tuvo un problema. Intenta de nuevo.";
	return falla(respuesta.status, mensaje, errores);
}

/**
 * Llama a la API. Si responde 401 y hay sesion, intenta renovar el token y
 * repite la llamada; si no se puede, termina la sesion. Las rutas de /auth no
 * se renuevan: un 401 del login solo significa credenciales incorrectas.
 */
export async function peticion(metodo, ruta, cuerpo) {
	const conSesion = Boolean(leerSesion());
	let respuesta;
	try {
		respuesta = await enviar(metodo, ruta, cuerpo);
		if (respuesta.status === 401 && conSesion && !ruta.startsWith("/auth/")) {
			if (await renovar()) respuesta = await enviar(metodo, ruta, cuerpo);
			if (respuesta.status === 401) terminarSesion();
		}
	} catch {
		return falla(0, SIN_CONEXION);
	}
	return interpretar(respuesta);
}

export const obtener = (ruta) => peticion("GET", ruta);
export const crear = (ruta, cuerpo) => peticion("POST", ruta, cuerpo);
export const reemplazar = (ruta, cuerpo) => peticion("PUT", ruta, cuerpo);
export const eliminar = (ruta) => peticion("DELETE", ruta);

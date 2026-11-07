/*
 * Proveedor de la sesion del usuario (RF-02, RF-13). La sesion es la cuenta que
 * entrego la API al iniciar sesion mas sus tokens JWT (ver context/sesion.js).
 * Las funciones de apoyo y el hook useSesion viven en context/sesion.js.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { usuarioDeApi, perfilParaApi } from "../services/adaptadores.js";
import * as api from "../services/recursos.js";
import { EVENTO_SESION_EXPIRADA, SesionContext, borrarSesion, guardarSesion, leerSesion } from "./sesion.js";

export default function SesionProvider({ children }) {
	const [sesion, setSesion] = useState(leerSesion);

	// La API rechazo los tokens y no pudo renovarlos: la sesion termino.
	useEffect(() => {
		const alExpirar = () => setSesion(null);
		window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
		return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
	}, []);

	/**
	 * Inicia sesion en la API. Devuelve { ok: true, sesion } o { ok: false, mensaje };
	 * el mensaje de credenciales no revela si fallo el correo o la contrasena (RF-02 CA3).
	 */
	const iniciar = useCallback(async (correo, contrasena) => {
		const respuesta = await api.iniciarSesion(String(correo).trim(), contrasena);
		if (!respuesta.ok) {
			return {
				ok: false,
				mensaje: respuesta.estado === 401 ? "Correo o contrasena incorrectos." : respuesta.mensaje,
			};
		}

		const tokens = respuesta.datos;
		const base = {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			run: tokens.run,
			nombre: tokens.nombre,
			apellidos: "",
			correo: String(correo).trim().toLowerCase(),
			rol: tokens.rol,
		};
		// El token ya sirve para pedir la cuenta completa (el login no trae apellidos ni correo).
		guardarSesion(base);
		const cuenta = await api.miCuenta();
		const nueva = cuenta.ok
			? { ...base, nombre: cuenta.datos.nombre, apellidos: cuenta.datos.apellidos, correo: cuenta.datos.correo }
			: base;
		guardarSesion(nueva);
		setSesion(nueva);
		return { ok: true, sesion: nueva };
	}, []);

	const cerrar = useCallback(() => {
		borrarSesion();
		setSesion(null);
	}, []);

	/**
	 * Guarda cambios en los datos de la cuenta (y la contrasena, si vienen
	 * contrasenaActual y contrasenaNueva). cuenta es la cuenta vigente; cambios
	 * se aplican encima. Refleja nombre, apellidos y correo en la sesion; nunca
	 * toca el RUN ni el rol.
	 */
	const actualizarPerfil = useCallback(
		async (cuenta, cambios) => {
			const respuesta = await api.editarMiCuenta(perfilParaApi({ ...cuenta, ...cambios }));
			if (!respuesta.ok) return { ok: false, mensaje: respuesta.mensaje };

			const guardada = usuarioDeApi(respuesta.datos);
			const vigente = leerSesion();
			if (vigente) {
				const nueva = { ...vigente, nombre: guardada.nombre, apellidos: guardada.apellidos, correo: guardada.correo };
				guardarSesion(nueva);
				setSesion(nueva);
			}
			return { ok: true, cuenta: guardada };
		},
		[],
	);

	const valor = useMemo(
		() => ({ sesion, iniciar, cerrar, actualizarPerfil }),
		[sesion, iniciar, cerrar, actualizarPerfil],
	);
	return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

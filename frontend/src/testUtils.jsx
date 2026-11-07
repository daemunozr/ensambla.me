/*
 * Apoyo para las pruebas de componentes: montaje con los mismos proveedores que
 * App.jsx (datos, sesion y carrito) dentro de un MemoryRouter, y sesiones de
 * ejemplo por rol.
 */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CarritoProvider from "./context/CarritoProvider.jsx";
import DatosProvider from "./context/DatosProvider.jsx";
import SesionProvider from "./context/SesionProvider.jsx";
import { reiniciarMundo } from "./testing/apiFalsa.js";

// Los tokens de prueba son "ROL:RUN": asi los entiende la API falsa (testing/apiFalsa.js).
const conTokens = (sesion) => ({
	...sesion,
	accessToken: `${sesion.rol}:${sesion.run}`,
	refreshToken: `REFRESH|${sesion.rol}:${sesion.run}`,
});

export const SESION_ADMIN = conTokens({ run: "11111111K", nombre: "Admin", apellidos: "Prueba", correo: "admin@duoc.cl", rol: "ADMIN" });
export const SESION_CLIENTE = conTokens({ run: "22222222K", nombre: "Cliente", apellidos: "Prueba", correo: "cliente@gmail.com", rol: "CLIENTE" });
export const SESION_LOGISTICA = conTokens({ run: "33333333K", nombre: "Bodega", apellidos: "Prueba", correo: "bodega@duoc.cl", rol: "LOGISTICA" });

/** Sesion de un usuario de la semilla (por su RUN), como la dejaria el inicio de sesion. */
export const sesionDe = ({ run, nombre, apellidos, correo, tipoUsuario }) =>
	conTokens({ run, nombre, apellidos, correo, rol: tipoUsuario });

/** Deja todo como en una visita nueva: sin sesion ni carrito, y la API falsa con los datos de la semilla. */
export function limpiarAlmacenamiento() {
	reiniciarMundo();
}

/**
 * Monta la interfaz con todos los proveedores. Si se pasa "sesion", queda
 * iniciada antes de renderizar (como si el usuario ya hubiera entrado).
 */
export function renderConProviders(interfaz, { ruta = "/", sesion = null } = {}) {
	if (sesion) window.sessionStorage.setItem("sesion", JSON.stringify(sesion));

	return render(
		<MemoryRouter initialEntries={[ruta]}>
			<SesionProvider>
				<DatosProvider precargado>
					<CarritoProvider>{interfaz}</CarritoProvider>
				</DatosProvider>
			</SesionProvider>
		</MemoryRouter>,
	);
}

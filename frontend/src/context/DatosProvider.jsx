/*
 * Proveedor de datos: expone las listas y el CRUD de data/datos.js y vuelve a
 * renderizar a sus consumidores tras cada cambio exitoso, para que la interfaz
 * refleje los datos al instante sin recargar la pagina.
 */
import { useCallback, useMemo, useState } from "react";
import * as datos from "../data/datos.js";
import { DatosContext } from "./datos.js";

export default function DatosProvider({ children }) {
	// Cada operacion exitosa cambia la version; las listas se releen con ella.
	const [version, setVersion] = useState(0);

	/** Envuelve una operacion de escritura para que avise del cambio si resulta. */
	const conAviso = useCallback(
		(operacion) =>
			(...argumentos) => {
				const resultado = operacion(...argumentos);
				if (resultado.ok) setVersion((actual) => actual + 1);
				return resultado;
			},
		[],
	);

	const valor = useMemo(
		() => ({
			version,
			productos: datos.productos(),
			usuarios: datos.usuarios(),
			categorias: datos.categorias(),
			ordenes: datos.ordenes(),
			itemsOrden: datos.itemsOrden(),
			crearProducto: conAviso(datos.crearProducto),
			actualizarProducto: conAviso(datos.actualizarProducto),
			eliminarProducto: conAviso(datos.eliminarProducto),
			crearUsuario: conAviso(datos.crearUsuario),
			actualizarUsuario: conAviso(datos.actualizarUsuario),
			eliminarUsuario: conAviso(datos.eliminarUsuario),
			crearCategoria: conAviso(datos.crearCategoria),
			actualizarCategoria: conAviso(datos.actualizarCategoria),
			eliminarCategoria: conAviso(datos.eliminarCategoria),
			crearOrden: conAviso(datos.crearOrden),
		}),
		[version, conAviso],
	);

	return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

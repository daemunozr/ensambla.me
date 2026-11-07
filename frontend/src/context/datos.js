/*
 * Contexto de datos: conecta la fuente de datos simulada (data/datos.js) con
 * los componentes. El proveedor esta en context/DatosProvider.jsx.
 */
import { createContext, useContext } from "react";

export const DatosContext = createContext(null);

/**
 * Listas vigentes (productos, usuarios, categorias) y operaciones CRUD. Tras
 * cada operacion exitosa, los componentes que usan este hook se vuelven a
 * renderizar con los datos nuevos.
 */
export function useDatos() {
	const contexto = useContext(DatosContext);
	if (!contexto) throw new Error("useDatos debe usarse dentro de <DatosProvider>");
	return contexto;
}

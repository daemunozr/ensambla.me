/*
 * Proveedor de datos: carga el catalogo (y, con sesion, las boletas y los
 * usuarios) desde la API, expone las listas y el CRUD de data/datos.js y vuelve
 * a renderizar a sus consumidores tras cada cambio, para que la interfaz
 * refleje los datos al instante sin recargar la pagina.
 *
 * Mientras llega la primera carga muestra "Cargando"; si el catalogo no llega,
 * un aviso con reintento. "precargado" omite esa primera carga (las pruebas
 * dejan la copia lista con sembrarDatos).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alerta from "../components/Alerta.jsx";
import * as datos from "../data/datos.js";
import { DatosContext } from "./datos.js";
import { leerSesion, useSesion } from "./sesion.js";

export default function DatosProvider({ children, precargado = false }) {
	const { sesion } = useSesion();
	// Cada cambio sube la version; las listas se releen con ella.
	const [version, setVersion] = useState(0);
	const [carga, setCarga] = useState({ estado: precargado ? "lista" : "cargando", mensaje: "" });

	// Catalogo y, si hay sesion, lo privado. La sesion vigente se lee del almacenamiento, que es
	// donde la guarda y la renueva el cliente HTTP.
	const cargarTodo = useCallback(async () => {
		const catalogo = await datos.cargarCatalogo();
		if (!catalogo.ok) return { estado: "error", mensaje: catalogo.mensaje };
		const vigente = leerSesion();
		if (vigente) await datos.cargarPrivados(vigente);
		return { estado: "lista", mensaje: "" };
	}, []);

	useEffect(() => {
		if (precargado) return undefined;
		let vigente = true;
		cargarTodo().then((resultado) => {
			if (!vigente) return;
			setCarga(resultado);
			setVersion((actual) => actual + 1);
		});
		return () => {
			vigente = false;
		};
	}, [precargado, cargarTodo]);

	const reintentar = () => {
		setCarga({ estado: "cargando", mensaje: "" });
		cargarTodo().then((resultado) => {
			setCarga(resultado);
			setVersion((actual) => actual + 1);
		});
	};

	// Al iniciar o cerrar sesion cambian las boletas y los usuarios que se pueden ver.
	const cuenta = sesion ? `${sesion.run}|${sesion.rol}` : "";
	const primeraVez = useRef(true);
	useEffect(() => {
		if (primeraVez.current) {
			primeraVez.current = false;
			return undefined;
		}
		let vigente = true;
		const actualizar = async () => {
			const actual = leerSesion();
			if (actual) await datos.cargarPrivados(actual);
			else datos.vaciarPrivados();
			if (vigente) setVersion((v) => v + 1);
		};
		actualizar();
		return () => {
			vigente = false;
		};
	}, [cuenta]);

	/** Envuelve una operacion de escritura para que avise del cambio al terminar. */
	const conAviso = useCallback(
		(operacion) =>
			async (...argumentos) => {
				const resultado = await operacion(...argumentos);
				setVersion((actual) => actual + 1);
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
			registrarCuenta: datos.registrarCuenta,
		}),
		[version, conAviso],
	);

	if (carga.estado === "cargando") {
		return (
			<main className="container py-5 text-center" role="status">
				<div className="spinner-border text-primary mb-3" aria-hidden="true" />
				<p className="mb-0">Cargando…</p>
			</main>
		);
	}

	if (carga.estado === "error") {
		return (
			<main className="container py-5">
				<h1 className="h3 mb-3">No pudimos cargar la tienda</h1>
				<Alerta tipo="danger">{carga.mensaje}</Alerta>
				<button type="button" className="btn btn-primary" onClick={reintentar}>
					Reintentar
				</button>
			</main>
		);
	}

	return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

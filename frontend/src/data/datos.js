/*
 * Datos del sistema: copia en memoria de lo que entrega la API, mas lectura y
 * escritura.
 *
 * Productos, categorias, usuarios y boletas (ordenes con sus items) se cargan
 * desde la API (services/recursos.js) y se guardan aqui para que la interfaz
 * los lea de forma sincrona. Cada escritura llama a la API y, si resulta,
 * vuelve a cargar lo que cambio; devuelve { ok, registro, mensaje } y con ok en
 * false no cambia nada. La interfaz las usa a traves de context/DatosProvider,
 * que vuelve a renderizar tras cada cambio.
 *
 * Regiones, comunas, roles, compatibilidad y blogs no los sirve la API: siguen
 * viniendo de data/semillas.js. Los usuarios solo se cargan para un
 * administrador; las boletas, para quien tiene sesion (un cliente recibe solo
 * las suyas).
 */
import { leerSesion } from "../context/sesion.js";
import { subtotalItems } from "../logic/ordenes.js";
import {
	boletaDeApi,
	boletaParaApi,
	categoriaParaApi,
	productoDeApi,
	productoParaApi,
	registroParaApi,
	usuarioDeApi,
	usuarioParaApi,
} from "../services/adaptadores.js";
import * as api from "../services/recursos.js";
import * as semillas from "./semillas.js";

export const { compatibilidad, regiones, comunas, roles, blogs } = semillas;

const CLAVE_ULTIMA_BOLETA = "ultimaBoleta";

const VACIO = { productos: [], categorias: [], usuarios: [], ordenes: [], itemsOrden: [] };
let copia = VACIO;

/** Reemplaza parte de la copia. Solo lo usan este modulo, el proveedor y las pruebas. */
export function reemplazarCopia(parcial) {
	copia = { ...copia, ...parcial };
}

/** Descarta lo privado (usuarios y boletas): al cerrar sesion o cambiar de cuenta. */
export function vaciarPrivados() {
	copia = { ...copia, usuarios: [], ordenes: [], itemsOrden: [] };
	borrarUltimaBoleta();
}

export function vaciarTodo() {
	copia = VACIO;
	borrarUltimaBoleta();
}

const exito = (registro, mensaje) => ({ ok: true, registro, mensaje });
const rechazo = (mensaje) => ({ ok: false, mensaje });
const plural = (n, singular, varios) => `${n} ${n === 1 ? singular : varios}`;

/* ==================================================== Boleta recien comprada */
// Un invitado no puede volver a pedir su boleta a la API, asi que la que acaba de
// comprar se guarda aparte para mostrarla (y sobrevivir a recargar la pagina).
function ultimaBoleta() {
	try {
		const guardada = window.sessionStorage.getItem(CLAVE_ULTIMA_BOLETA);
		return guardada ? JSON.parse(guardada) : null;
	} catch {
		return null;
	}
}

function guardarUltimaBoleta(boleta) {
	try {
		window.sessionStorage.setItem(CLAVE_ULTIMA_BOLETA, JSON.stringify(boleta));
	} catch (error) {
		console.error("datos: no se pudo guardar la boleta", error);
	}
}

function borrarUltimaBoleta() {
	try {
		window.sessionStorage.removeItem(CLAVE_ULTIMA_BOLETA);
	} catch {
		// Sin almacenamiento no hay nada que borrar.
	}
}

/* ================================================================== Carga */
/** Productos y categorias: son publicos. */
export async function cargarCatalogo() {
	const [prods, cats] = await Promise.all([api.listarProductos(), api.listarCategorias()]);
	const fallo = [prods, cats].find((r) => !r.ok);
	if (fallo) return rechazo(fallo.mensaje);
	reemplazarCopia({ productos: prods.datos.map(productoDeApi), categorias: cats.datos });
	return { ok: true };
}

/** Lo que pide una sesion: sus boletas y, si es administrador, los usuarios. */
export async function cargarPrivados(sesion) {
	const [boletas, cuentas] = await Promise.all([
		api.listarBoletas(),
		sesion.rol === "ADMIN" ? api.listarUsuarios() : Promise.resolve({ ok: true, datos: [] }),
	]);
	const fallo = [boletas, cuentas].find((r) => !r.ok);
	if (fallo) return rechazo(fallo.mensaje);

	const convertidas = boletas.datos.map(boletaDeApi);
	reemplazarCopia({
		usuarios: cuentas.datos.map(usuarioDeApi),
		ordenes: convertidas.map((b) => b.orden),
		itemsOrden: convertidas.flatMap((b) => b.items),
	});
	return { ok: true };
}

/** Vuelve a cargar lo que depende de la sesion vigente tras una escritura. */
async function recargarPrivados() {
	const sesion = leerSesion();
	if (sesion) await cargarPrivados(sesion);
}

/* ====================================================================== Lectura */
export const productos = () => copia.productos;
export const producto = (sku) => copia.productos.find((p) => p.sku === sku);
export const usuarios = () => copia.usuarios;
export const usuario = (run) => copia.usuarios.find((u) => u.run === run);
export const categorias = () => copia.categorias;
export const categoria = (codigo) => copia.categorias.find((c) => c.codigo === codigo);
export const ordenes = () => copia.ordenes;
export const itemsOrden = () => copia.itemsOrden;

// El personal no carga los usuarios (solo un administrador puede), pero la boleta trae el nombre.
export const nombreCliente = (run) => {
	const cliente = usuario(run);
	if (cliente) return `${cliente.nombre} ${cliente.apellidos}`;
	return copia.ordenes.find((o) => o.cliente === run)?.nombre ?? run;
};
export const nombreCategoria = (codigo) => categoria(codigo)?.nombre ?? codigo;
export const nombreRol = (codigo) => roles.find((r) => r.codigo === codigo)?.nombre ?? codigo;
export const comuna = (codigo) => comunas.find((c) => c.codigo === codigo);
export const comunasDe = (region) => comunas.filter((c) => c.region === region);
export const nombreComuna = (codigo) => comuna(codigo)?.nombre ?? "";
export const nombreRegionDeComuna = (codigo) =>
	regiones.find((r) => r.codigo === comuna(codigo)?.region)?.nombre ?? "";
export const blog = (slug) => blogs.find((b) => b.slug === slug);

/* Asistente de armado (RF-07): solo las categorias con posicion en el recorrido. */
export const categoriasDeArmado = () =>
	categorias()
		.filter((c) => c.orden)
		.sort((a, b) => a.orden - b.orden);
export const productosDe = (codigo) => productos().filter((p) => p.categoria === codigo);
export const admisibles = (sku) => compatibilidad.filter((c) => c.producto === sku).map((c) => c.admisible);

/* Ordenes (RF-12): el total incluye el costo de envio. */
export const orden = (numero) => {
	const cargada = copia.ordenes.find((o) => o.numero === numero);
	if (cargada) return cargada;
	const reciente = ultimaBoleta();
	return reciente?.orden.numero === numero ? reciente.orden : undefined;
};
export const itemsDeOrden = (numero) => {
	const cargados = copia.itemsOrden.filter((i) => i.orden === numero);
	if (cargados.length) return cargados;
	const reciente = ultimaBoleta();
	return reciente?.orden.numero === numero ? reciente.items : [];
};
export const subtotalOrden = (numero) => subtotalItems(itemsDeOrden(numero));
export const totalOrden = (numero) => subtotalOrden(numero) + (orden(numero)?.costoEnvio ?? 0);

/* ================================================================== Productos */
export async function crearProducto(nuevo) {
	const respuesta = await api.crearProducto(productoParaApi(nuevo));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(productoDeApi(respuesta.datos), `El producto ${nuevo.sku} se creo correctamente.`);
}

/** El SKU identifica al producto y no cambia al editarlo. */
export async function actualizarProducto(sku, datos) {
	const respuesta = await api.editarProducto(sku, productoParaApi({ ...datos, sku }));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(productoDeApi(respuesta.datos), `El producto ${sku} se guardo correctamente.`);
}

/**
 * Las boletas conservan sus lineas (con el precio al comprar); el servidor no
 * deja eliminar un producto que figure en alguna.
 */
export async function eliminarProducto(sku) {
	const existente = producto(sku);
	const respuesta = await api.quitarProducto(sku);
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(existente, `El producto ${sku} (${existente?.nombre ?? sku}) se elimino.`);
}

/* =================================================================== Usuarios */
export async function crearUsuario(nuevo) {
	const respuesta = await api.crearUsuario(usuarioParaApi(nuevo));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await recargarPrivados();
	const registro = usuarioDeApi(respuesta.datos);
	return exito(registro, `El usuario con RUN ${registro.run} se creo correctamente.`);
}

/** Registro publico (RF-01): crea una cuenta Cliente. El servidor no deja elegir el rol. */
export async function registrarCuenta(nuevo) {
	const respuesta = await api.registrarCuenta(registroParaApi(nuevo));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	return exito(usuarioDeApi(respuesta.datos), `La cuenta con RUN ${respuesta.datos.run} se creo correctamente.`);
}

export async function actualizarUsuario(run, datos) {
	const respuesta = await api.editarUsuario(run, usuarioParaApi({ ...datos, run }));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await recargarPrivados();
	return exito(usuarioDeApi(respuesta.datos), `El usuario con RUN ${run} se guardo correctamente.`);
}

/**
 * No se elimina la cuenta con la sesion iniciada (lo comprueba la interfaz) ni
 * un usuario con boletas, que lo referencian (lo rechaza el servidor).
 */
export async function eliminarUsuario(run, runSesion = null) {
	const existente = usuario(run);
	if (run === runSesion) return rechazo("No puedes eliminar tu propia cuenta mientras tienes la sesion iniciada.");

	const respuesta = await api.quitarUsuario(run);
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await recargarPrivados();
	const nombre = existente ? `${existente.nombre} ${existente.apellidos}` : run;
	return exito(existente, `El usuario ${nombre} (RUN ${run}) se elimino.`);
}

/* ================================================================= Categorias */
export async function crearCategoria(nueva) {
	// Las categorias nuevas no participan del asistente: su recorrido depende de
	// la tabla de compatibilidad, que no se mantiene desde el panel.
	const respuesta = await api.crearCategoria(categoriaParaApi({ codigo: nueva.codigo, nombre: nueva.nombre }));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(respuesta.datos, `La categoria ${respuesta.datos.nombre} se creo correctamente.`);
}

/** Solo cambia el nombre: el codigo es la clave y el orden lo fija el asistente. */
export async function actualizarCategoria(codigo, datos) {
	const existente = categoria(codigo);
	if (!existente) return rechazo(`No existe una categoria con el codigo ${codigo}.`);
	const respuesta = await api.editarCategoria(codigo, categoriaParaApi({ ...existente, nombre: datos.nombre }));
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(respuesta.datos, `La categoria ${respuesta.datos.nombre} se guardo correctamente.`);
}

/**
 * No se elimina una categoria del asistente (lo comprueba la interfaz: el modo
 * equipo completo exige una opcion en cada paso) ni una con productos (lo
 * rechaza el servidor).
 */
export async function eliminarCategoria(codigo) {
	const existente = categoria(codigo);
	if (!existente) return rechazo(`No existe una categoria con el codigo ${codigo}.`);
	if (existente.orden) {
		return rechazo(`La categoria ${existente.nombre} es el paso ${existente.orden} del asistente de armado y no se puede eliminar.`);
	}

	const suyos = productosDe(codigo).length;
	if (suyos) {
		return rechazo(
			`No se puede eliminar ${existente.nombre}: tiene ${plural(suyos, "producto", "productos")}. Cambialos de categoria o eliminalos antes.`,
		);
	}

	const respuesta = await api.quitarCategoria(codigo);
	if (!respuesta.ok) return rechazo(respuesta.mensaje);
	await cargarCatalogo();
	return exito(existente, `La categoria ${existente.nombre} se elimino.`);
}

/* ===================================================================== Boletas */
/**
 * Registra una compra. comprador es { nombre, correo, direccion, comuna }. El
 * servidor calcula precios, envio y total, descuenta el stock y numera la
 * boleta; la cuenta compradora sale del token (sin sesion, es un invitado).
 */
export async function crearOrden({ comprador, entrega, medioPago, lineas }) {
	if (!lineas?.length) return rechazo("No hay productos para comprar.");

	const respuesta = await api.comprar(boletaParaApi({ comprador, entrega, medioPago, lineas }));
	// Con o sin exito el stock pudo cambiar: se vuelve a leer el catalogo.
	await cargarCatalogo();
	if (!respuesta.ok) return rechazo(respuesta.mensaje);

	const boleta = boletaDeApi(respuesta.datos);
	guardarUltimaBoleta(boleta);
	await recargarPrivados();
	return exito(boleta.orden, `La orden ${boleta.orden.numero} se registro correctamente.`);
}

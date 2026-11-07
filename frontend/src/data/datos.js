/*
 * Fuente de datos simulada del sistema: lectura y CRUD.
 *
 * Productos, usuarios, categorias y ordenes (con sus items) son colecciones con
 * copia de trabajo en sessionStorage (data/coleccion.js), sembradas desde
 * data/semillas.js; el resto de las relaciones son de solo lectura. Las operaciones de escritura
 * aplican las reglas de negocio y devuelven { ok, registro, mensaje }: con
 * ok en false no cambian nada. La interfaz las usa a traves de
 * context/DatosProvider, que vuelve a renderizar tras cada cambio.
 */
import { consolidar, costoEnvio, entregaDe, faltantes } from "../logic/checkout.js";
import { siguienteNumero, subtotalItems } from "../logic/ordenes.js";
import { fechaLocal } from "../utils/formato.js";
import { crearColeccion } from "./coleccion.js";
import * as semillas from "./semillas.js";

export const { compatibilidad, regiones, comunas, roles, blogs } = semillas;

const tablaProductos = crearColeccion({ clave: "productos", semilla: semillas.productos, id: "sku" });
const tablaUsuarios = crearColeccion({ clave: "usuarios", semilla: semillas.usuarios, id: "run" });
const tablaCategorias = crearColeccion({ clave: "categorias", semilla: semillas.categorias, id: "codigo" });
const tablaOrdenes = crearColeccion({ clave: "ordenes", semilla: semillas.ordenes, id: "numero" });
// La clave de un item es compuesta: (orden, producto).
const tablaItems = crearColeccion({
	clave: "itemsOrden",
	semilla: semillas.itemsOrden,
	id: (item) => `${item.orden}|${item.producto}`,
});

const exito = (registro, mensaje) => ({ ok: true, registro, mensaje });
const rechazo = (mensaje) => ({ ok: false, mensaje });
const plural = (n, singular, varios) => `${n} ${n === 1 ? singular : varios}`;

/* ====================================================================== Lectura */
export const productos = tablaProductos.listar;
export const producto = tablaProductos.obtener;
export const usuarios = tablaUsuarios.listar;
export const usuario = tablaUsuarios.obtener;
export const categorias = tablaCategorias.listar;
export const categoria = tablaCategorias.obtener;
export const ordenes = tablaOrdenes.listar;
export const itemsOrden = tablaItems.listar;
export const itemOrden = tablaItems.obtener;

export const nombreCliente = (run) => {
	const cliente = usuario(run);
	return cliente ? `${cliente.nombre} ${cliente.apellidos}` : run;
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
export const orden = tablaOrdenes.obtener;
export const ordenesDe = (run) => ordenes().filter((o) => o.cliente === run);
export const itemsDeOrden = (numero) => itemsOrden().filter((i) => i.orden === numero);
export const subtotalOrden = (numero) => subtotalItems(itemsDeOrden(numero));
export const totalOrden = (numero) => subtotalOrden(numero) + (orden(numero)?.costoEnvio ?? 0);

/* ================================================================== Productos */
export function crearProducto(nuevo) {
	if (tablaProductos.existe(nuevo.sku)) return rechazo(`Ya existe un producto con el codigo ${nuevo.sku}.`);
	tablaProductos.insertar(nuevo);
	return exito(nuevo, `El producto ${nuevo.sku} se creo correctamente.`);
}

/** El SKU identifica al producto y no cambia al editarlo. */
export function actualizarProducto(sku, datos) {
	if (!tablaProductos.existe(sku)) return rechazo(`No existe un producto con el codigo ${sku}.`);
	const registro = { ...datos, sku };
	tablaProductos.reemplazar(sku, registro);
	return exito(registro, `El producto ${sku} se guardo correctamente.`);
}

/**
 * Las ordenes conservan sus lineas (con el precio al comprar) aunque el
 * producto ya no este en el catalogo, y el carrito descarta la linea al leerse.
 */
export function eliminarProducto(sku) {
	const existente = producto(sku);
	if (!existente) return rechazo(`No existe un producto con el codigo ${sku}.`);
	tablaProductos.quitar(sku);
	return exito(existente, `El producto ${sku} (${existente.nombre}) se elimino.`);
}

/* =================================================================== Usuarios */
const correoEnUso = (correo, salvoRun = null) =>
	usuarios().some((u) => u.correo.toLowerCase() === correo.toLowerCase() && u.run !== salvoRun);

/** El RUN es la clave de Usuario y el correo es credencial: ambos son unicos. */
export function crearUsuario(nuevo) {
	const registro = { ...nuevo, run: nuevo.run.toUpperCase(), correo: nuevo.correo.toLowerCase() };
	if (tablaUsuarios.existe(registro.run)) return rechazo(`Ya existe un usuario con RUN ${registro.run}.`);
	if (correoEnUso(registro.correo)) return rechazo(`El correo ${registro.correo} ya esta usado por otro usuario.`);
	tablaUsuarios.insertar(registro);
	return exito(registro, `El usuario con RUN ${registro.run} se creo correctamente.`);
}

export function actualizarUsuario(run, datos) {
	if (!tablaUsuarios.existe(run)) return rechazo(`No existe un usuario con RUN ${run}.`);
	const registro = { ...datos, run, correo: datos.correo.toLowerCase() };
	if (correoEnUso(registro.correo, run)) return rechazo(`El correo ${registro.correo} ya esta usado por otro usuario.`);
	tablaUsuarios.reemplazar(run, registro);
	return exito(registro, `El usuario con RUN ${run} se guardo correctamente.`);
}

/**
 * No se elimina la cuenta con la sesion iniciada ni un usuario con ordenes,
 * que lo referencian como cliente (Orden.cliente).
 */
export function eliminarUsuario(run, runSesion = null) {
	const existente = usuario(run);
	if (!existente) return rechazo(`No existe un usuario con RUN ${run}.`);
	if (run === runSesion) return rechazo("No puedes eliminar tu propia cuenta mientras tienes la sesion iniciada.");

	const suyas = ordenesDe(run).length;
	if (suyas) {
		return rechazo(
			`No se puede eliminar a ${existente.nombre} ${existente.apellidos}: tiene ${plural(suyas, "orden", "ordenes")} a su nombre.`,
		);
	}

	tablaUsuarios.quitar(run);
	return exito(existente, `El usuario ${existente.nombre} ${existente.apellidos} (RUN ${run}) se elimino.`);
}

/* ================================================================= Categorias */
export function crearCategoria(nueva) {
	if (tablaCategorias.existe(nueva.codigo)) return rechazo(`Ya existe una categoria con el codigo ${nueva.codigo}.`);
	// Las categorias nuevas no participan del asistente: su recorrido depende de
	// la tabla de compatibilidad, que no se mantiene desde el panel.
	const registro = { codigo: nueva.codigo, nombre: nueva.nombre };
	tablaCategorias.insertar(registro);
	return exito(registro, `La categoria ${registro.nombre} se creo correctamente.`);
}

/** Solo cambia el nombre: el codigo es la clave y el orden lo fija el asistente. */
export function actualizarCategoria(codigo, datos) {
	const existente = categoria(codigo);
	if (!existente) return rechazo(`No existe una categoria con el codigo ${codigo}.`);
	const registro = { ...existente, nombre: datos.nombre };
	tablaCategorias.reemplazar(codigo, registro);
	return exito(registro, `La categoria ${registro.nombre} se guardo correctamente.`);
}

/**
 * No se elimina una categoria con productos (Producto.categoria la referencia)
 * ni una del asistente: el modo equipo completo exige una opcion en cada paso.
 */
export function eliminarCategoria(codigo) {
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

	tablaCategorias.quitar(codigo);
	return exito(existente, `La categoria ${existente.nombre} se elimino.`);
}

/* ===================================================================== Ordenes */
/**
 * Registra una compra. comprador es { nombre, correo, direccion, comuna } y
 * cliente es el RUN de quien compra, o "" si es un invitado. Se valida todo
 * antes de escribir: con ok en false no cambia nada. Al registrarla descuenta
 * el stock de cada producto.
 */
export function crearOrden({ cliente = "", comprador, entrega, medioPago, lineas }) {
	if (!lineas?.length) return rechazo("No hay productos para comprar.");
	if (!entregaDe(entrega)) return rechazo("Elige una opcion de entrega valida.");
	if (cliente && !usuario(cliente)) return rechazo("La cuenta con la que compras ya no existe.");

	const items = consolidar(lineas, producto);
	const sinStock = faltantes(items, producto);
	if (sinStock.length) return rechazo(`Sin stock suficiente: ${sinStock.join(", ")}.`);

	const fecha = fechaLocal();
	const numero = siguienteNumero(ordenes(), fecha);
	const registro = {
		numero,
		cliente,
		fecha,
		nombre: comprador.nombre,
		correo: comprador.correo.toLowerCase(),
		direccion: comprador.direccion,
		comuna: comprador.comuna,
		entrega,
		costoEnvio: costoEnvio(entrega, subtotalItems(items)),
		medioPago,
	};

	tablaOrdenes.insertar(registro);
	tablaItems.insertarVarios(items.map((item) => ({ orden: numero, ...item })));
	items.forEach(({ producto: sku, cantidad }) => {
		const existente = producto(sku);
		tablaProductos.reemplazar(sku, { ...existente, stock: Number(existente.stock) - cantidad });
	});

	return exito(registro, `La orden ${numero} se registro correctamente.`);
}

/*
 * Traduccion entre la forma de los datos de la API y la que usa la interfaz.
 * La interfaz conserva su forma (ordenes con "cliente", items con "producto"...)
 * para que logic/, las tablas y los reportes no dependan del formato del servidor.
 */
import { comunas } from "../data/semillas.js";

const numeroONulo = (valor) => (valor === "" || valor === null || valor === undefined ? null : Number(valor));
const textoONulo = (valor) => (valor === "" || valor === undefined ? null : valor);

/* ================================================================== Productos */
export function productoDeApi(p) {
	const { nombreCategoria: _nombreCategoria, ...resto } = p;
	return {
		...resto,
		descripcion: p.descripcion ?? "",
		precio: Number(p.precio),
		descuento: p.descuento ?? "",
		stockCritico: p.stockCritico ?? "",
		imagen: p.imagen ?? "",
		video: p.video ?? "",
	};
}

export const productoParaApi = (p) => ({
	sku: p.sku,
	nombre: p.nombre,
	descripcion: textoONulo(p.descripcion),
	precio: Number(p.precio),
	descuento: numeroONulo(p.descuento),
	stock: Number(p.stock),
	stockCritico: numeroONulo(p.stockCritico),
	imagen: textoONulo(p.imagen),
	video: textoONulo(p.video),
	categoria: p.categoria,
});

/* ================================================================== Categorias */
export const categoriaParaApi = (c) => ({ codigo: c.codigo, nombre: c.nombre, orden: numeroONulo(c.orden) });

/* =================================================================== Usuarios */
export function usuarioDeApi(u) {
	return { ...u, fechaNacimiento: u.fechaNacimiento ?? "" };
}

/** La region no se captura aparte: se deduce de la comuna (RM-02 -> RM). */
const regionDe = (comuna) => comunas.find((c) => c.codigo === comuna)?.region ?? "";

export const usuarioParaApi = (u) => ({
	run: u.run,
	nombre: u.nombre,
	apellidos: u.apellidos,
	correo: u.correo,
	contrasena: u.contrasena,
	fechaNacimiento: textoONulo(u.fechaNacimiento),
	region: u.region || regionDe(u.comuna),
	comuna: u.comuna,
	direccion: u.direccion,
	tipoUsuario: u.tipoUsuario,
});

export const registroParaApi = (u) => {
	const { tipoUsuario: _tipoUsuario, ...registro } = usuarioParaApi(u);
	return registro;
};

export const perfilParaApi = (u) => ({
	nombre: u.nombre,
	apellidos: u.apellidos,
	correo: u.correo,
	fechaNacimiento: textoONulo(u.fechaNacimiento),
	region: u.region || regionDe(u.comuna),
	comuna: u.comuna,
	direccion: u.direccion,
	contrasenaActual: textoONulo(u.contrasenaActual),
	contrasenaNueva: textoONulo(u.contrasenaNueva),
});

/* ==================================================================== Boletas */
/** Una boleta de la API pasa a { orden, items } con la forma que usa la interfaz. */
export function boletaDeApi(b) {
	return {
		orden: {
			numero: b.numero,
			cliente: b.usuario ?? "",
			fecha: b.fecha,
			nombre: b.nombre,
			correo: b.correo,
			direccion: b.direccion,
			comuna: b.comuna,
			entrega: b.entrega,
			costoEnvio: Number(b.costoEnvio),
			medioPago: b.medioPago,
		},
		items: b.detalles.map((d) => ({
			orden: b.numero,
			producto: d.sku,
			cantidad: d.cantidad,
			precioUnitario: Number(d.precioUnitario),
		})),
	};
}

/** Las lineas del carrito, una por SKU: el servidor calcula precios, envio y total. */
export function boletaParaApi({ comprador, entrega, medioPago, lineas }) {
	const porSku = new Map();
	lineas.forEach(({ producto, cantidad }) => porSku.set(producto, (porSku.get(producto) ?? 0) + Number(cantidad)));
	return {
		nombre: comprador.nombre,
		correo: comprador.correo,
		direccion: comprador.direccion,
		comuna: comprador.comuna,
		entrega,
		medioPago,
		lineas: [...porSku].map(([sku, cantidad]) => ({ sku, cantidad })),
	};
}

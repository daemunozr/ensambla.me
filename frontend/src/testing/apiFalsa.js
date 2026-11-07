/*
 * API falsa para las pruebas: reemplaza fetch por un servidor en memoria con
 * los mismos endpoints, permisos, errores y reglas de negocio que el backend
 * (/api/v1), sembrado con data/semillas.js. Asi las pruebas de la interfaz
 * recorren el camino real (servicios, adaptadores y cliente HTTP) sin red.
 *
 * Tokens: el de acceso es "ROL:RUN" y el de renovacion "REFRESH|ROL:RUN".
 * vencerAccesos() hace que la API rechace (401) los accesos emitidos hasta
 * ese momento; una renovacion emite uno nuevo ("ROL:RUN|nuevo").
 */
import { vi } from "vitest";
import { reemplazarCopia, vaciarTodo } from "../data/datos.js";
import * as semillas from "../data/semillas.js";
import { costoEnvio } from "../logic/checkout.js";
import { desgloseIva, siguienteNumero } from "../logic/ordenes.js";
import { precioVigente } from "../logic/precios.js";
import { fechaLocal } from "../utils/formato.js";
import { boletaDeApi, productoDeApi, usuarioDeApi } from "../services/adaptadores.js";

let bd;
let accesosVencidos;
export const llamadas = [];

const clonar = (valor) => structuredClone(valor);
const regionDe = (codigo) => semillas.comunas.find((c) => c.codigo === codigo)?.region ?? "";

/* ------------------------------------------------------------- Forma de la API */
const productoApi = (p) => ({
	...p,
	descripcion: p.descripcion ?? null,
	descuento: p.descuento === "" ? null : (p.descuento ?? null),
	stockCritico: p.stockCritico === "" ? null : (p.stockCritico ?? null),
	nombreCategoria: bd.categorias.find((c) => c.codigo === p.categoria)?.nombre ?? null,
});

const usuarioApi = (u) => {
	const { contrasena: _contrasena, ...resto } = u;
	return { ...resto, fechaNacimiento: u.fechaNacimiento || null, region: regionDe(u.comuna) };
};

function boletaApi(orden) {
	const detalles = bd.itemsOrden
		.filter((i) => i.orden === orden.numero)
		.map((i) => ({
			sku: i.producto,
			nombreProducto: bd.productos.find((p) => p.sku === i.producto)?.nombre ?? i.producto,
			cantidad: i.cantidad,
			precioUnitario: i.precioUnitario,
			subtotal: i.cantidad * i.precioUnitario,
		}));
	const subtotal = detalles.reduce((suma, d) => suma + d.subtotal, 0);
	const total = subtotal + orden.costoEnvio;
	const { neto, iva } = desgloseIva(total);
	return {
		numero: orden.numero,
		usuario: orden.cliente || null,
		fecha: orden.fecha,
		nombre: orden.nombre,
		correo: orden.correo,
		direccion: orden.direccion,
		comuna: orden.comuna,
		entrega: orden.entrega,
		medioPago: orden.medioPago,
		detalles,
		subtotal,
		costoEnvio: orden.costoEnvio,
		total,
		neto,
		iva,
	};
}

/* ---------------------------------------------------------------- Estado */
export function reiniciarApiFalsa() {
	bd = clonar({
		productos: semillas.productos,
		categorias: semillas.categorias,
		usuarios: semillas.usuarios,
		ordenes: semillas.ordenes,
		itemsOrden: semillas.itemsOrden,
	});
	accesosVencidos = false;
	llamadas.length = 0;
}

/** Deja la copia en memoria de la interfaz como si ya hubiera cargado todo (con permisos de administrador). */
export function sembrarCopia() {
	const boletas = bd.ordenes.map((o) => boletaDeApi(boletaApi(o)));
	reemplazarCopia({
		productos: bd.productos.map((p) => productoDeApi(productoApi(p))),
		categorias: clonar(bd.categorias),
		usuarios: bd.usuarios.map((u) => usuarioDeApi(usuarioApi(u))),
		ordenes: boletas.map((b) => b.orden),
		itemsOrden: boletas.flatMap((b) => b.items),
	});
}

/** Estado limpio para una prueba: API sembrada, copia de la interfaz cargada y sin lo guardado en el navegador. */
export function reiniciarMundo() {
	window.sessionStorage.clear();
	window.localStorage.clear();
	vaciarTodo();
	reiniciarApiFalsa();
	sembrarCopia();
}

export const vencerAccesos = () => {
	accesosVencidos = true;
};

/** Datos de la API en este momento (para comprobar que una escritura llego). */
export const baseDeDatos = () => bd;

/* ---------------------------------------------------------------- Respuestas */
const respuesta = (estado, cuerpo) =>
	new Response(estado === 204 ? null : JSON.stringify(cuerpo), {
		status: estado,
		headers: { "Content-Type": "application/json" },
	});

const error = (estado, mensaje, errores = null) =>
	respuesta(estado, { estado, mensaje, errores, fecha: new Date().toISOString() });

const tokensDe = (usuario) => ({
	accessToken: `${usuario.tipoUsuario}:${usuario.run}`,
	refreshToken: `REFRESH|${usuario.tipoUsuario}:${usuario.run}`,
	tipo: "Bearer",
	expiraEn: 900,
	run: usuario.run,
	nombre: usuario.nombre,
	rol: usuario.tipoUsuario,
});

/* ----------------------------------------------------------------- Servidor */
function quien(cabeceras) {
	const autorizacion = cabeceras.Authorization ?? "";
	if (!autorizacion) return { anonimo: true };
	const token = autorizacion.replace("Bearer ", "");
	if (token.startsWith("REFRESH|")) return { invalido: true };
	if (accesosVencidos && !token.endsWith("|nuevo")) return { invalido: true };
	const [rol, run] = token.split("|")[0].split(":");
	return rol && run ? { rol, run } : { invalido: true };
}

const soloAdmin = (yo) => (yo.rol === "ADMIN" ? null : error(403, "No tienes permiso para esta accion."));

const correoLibre = (correo, salvoRun) =>
	!bd.usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase() && u.run !== salvoRun);

function usuarioDesde(cuerpo, base = {}) {
	return {
		run: base.run ?? cuerpo.run.toUpperCase(),
		nombre: cuerpo.nombre,
		apellidos: cuerpo.apellidos,
		correo: cuerpo.correo.toLowerCase(),
		contrasena: cuerpo.contrasena ?? base.contrasena,
		fechaNacimiento: cuerpo.fechaNacimiento ?? "",
		comuna: cuerpo.comuna,
		direccion: cuerpo.direccion,
		tipoUsuario: cuerpo.tipoUsuario ?? base.tipoUsuario,
	};
}

function comprar(cuerpo, yo) {
	if (!cuerpo.lineas?.length) return error(400, "La compra debe tener al menos un producto.");
	const fecha = fechaLocal();
	const items = [];
	for (const { sku, cantidad } of cuerpo.lineas) {
		const producto = bd.productos.find((p) => p.sku === sku);
		if (!producto) return error(404, `No existe el producto ${sku}.`);
		if (Number(producto.stock) < cantidad) {
			return error(409, `Sin stock suficiente de ${producto.nombre}: quedan ${producto.stock}.`);
		}
		items.push({ producto: sku, cantidad, precioUnitario: precioVigente(producto) });
	}
	const subtotal = items.reduce((suma, i) => suma + i.cantidad * i.precioUnitario, 0);
	const numero = siguienteNumero(bd.ordenes, fecha);
	const orden = {
		numero,
		cliente: yo.anonimo ? "" : yo.run,
		fecha,
		nombre: cuerpo.nombre,
		correo: cuerpo.correo.toLowerCase(),
		direccion: cuerpo.direccion,
		comuna: cuerpo.comuna,
		entrega: cuerpo.entrega,
		costoEnvio: costoEnvio(cuerpo.entrega, subtotal),
		medioPago: cuerpo.medioPago,
	};
	bd.ordenes.push(orden);
	items.forEach((item) => {
		bd.itemsOrden.push({ orden: numero, ...item });
		const producto = bd.productos.find((p) => p.sku === item.producto);
		producto.stock = Number(producto.stock) - item.cantidad;
	});
	return respuesta(201, boletaApi(orden));
}

function atender(metodo, ruta, cuerpo, yo) {
	const partes = ruta.split("/").filter(Boolean).map(decodeURIComponent);
	const [recurso, id] = partes;
	const exige = yo.anonimo ? error(401, "Falta la sesion.") : null;

	if (recurso === "auth") {
		if (id === "login") {
			const u = bd.usuarios.find((x) => x.correo.toLowerCase() === cuerpo.correo.toLowerCase() && x.contrasena === cuerpo.contrasena);
			return u ? respuesta(200, tokensDe(u)) : error(401, "Credenciales invalidas.");
		}
		if (id === "registro") {
			const run = cuerpo.run.toUpperCase();
			if (bd.usuarios.some((u) => u.run === run)) return error(409, `Ya existe un usuario con el RUN ${run}.`);
			if (!correoLibre(cuerpo.correo)) return error(409, `Ya existe un usuario con el correo ${cuerpo.correo}.`);
			const nuevo = usuarioDesde({ ...cuerpo, tipoUsuario: "CLIENTE" });
			bd.usuarios.push(nuevo);
			return respuesta(201, usuarioApi(nuevo));
		}
		if (id === "refresh") {
			const token = cuerpo.refreshToken ?? "";
			if (!token.startsWith("REFRESH|")) return error(401, "El token es invalido o esta vencido.");
			const [rol, run] = token.slice(8).split(":");
			return respuesta(200, {
				...tokensDe({ run, tipoUsuario: rol, nombre: "" }),
				accessToken: `${rol}:${run}|nuevo`,
			});
		}
	}

	if (yo.invalido) return error(401, "El token es invalido o esta vencido.");

	if (recurso === "productos" || recurso === "categorias") {
		const lista = bd[recurso];
		const clave = recurso === "productos" ? "sku" : "codigo";
		const mapa = recurso === "productos" ? productoApi : (c) => c;
		const existente = id ? lista.find((r) => r[clave] === id) : null;
		const etiqueta = recurso === "productos" ? "producto" : "categoria";
		const uno = recurso === "productos" ? "un" : "una";

		if (metodo === "GET") {
			if (!id) return respuesta(200, lista.map(mapa));
			return existente ? respuesta(200, mapa(existente)) : error(404, `No existe el ${etiqueta} ${id}.`);
		}
		const prohibido = exige ?? soloAdmin(yo);
		if (prohibido) return prohibido;
		if (metodo === "POST") {
			if (lista.some((r) => r[clave] === cuerpo[clave])) return error(409, `Ya existe ${uno} ${etiqueta} con el codigo ${cuerpo[clave]}.`);
			if (recurso === "productos" && !bd.categorias.some((c) => c.codigo === cuerpo.categoria)) {
				return error(404, `No existe la categoria ${cuerpo.categoria}.`);
			}
			lista.push(clonar(cuerpo));
			return respuesta(201, mapa(cuerpo));
		}
		if (!existente) return error(404, `No existe el ${etiqueta} ${id}.`);
		if (metodo === "PUT") {
			Object.assign(existente, clonar(cuerpo), { [clave]: id });
			return respuesta(200, mapa(existente));
		}
		if (metodo === "DELETE") {
			if (recurso === "categorias" && bd.productos.some((p) => p.categoria === id)) {
				return error(409, `No se puede eliminar la categoria ${id}: tiene productos.`);
			}
			if (recurso === "productos" && bd.itemsOrden.some((i) => i.producto === id)) {
				return error(409, `No se puede eliminar el producto ${id}: figura en boletas.`);
			}
			lista.splice(lista.indexOf(existente), 1);
			return respuesta(204);
		}
	}

	if (recurso === "usuarios") {
		if (exige) return exige;
		if (id === "me") {
			const yoUsuario = bd.usuarios.find((u) => u.run === yo.run);
			if (!yoUsuario) return error(404, `No existe el usuario ${yo.run}.`);
			if (metodo === "GET") return respuesta(200, usuarioApi(yoUsuario));
			if (metodo === "PUT") {
				if (!correoLibre(cuerpo.correo, yo.run)) return error(409, `Ya existe un usuario con el correo ${cuerpo.correo}.`);
				let contrasena = yoUsuario.contrasena;
				if (cuerpo.contrasenaNueva) {
					if (cuerpo.contrasenaActual !== yoUsuario.contrasena) return error(400, "La contrasena actual no es correcta.");
					contrasena = cuerpo.contrasenaNueva;
				}
				Object.assign(yoUsuario, usuarioDesde({ ...cuerpo, contrasena }, yoUsuario));
				return respuesta(200, usuarioApi(yoUsuario));
			}
		}
		const prohibido = soloAdmin(yo);
		if (prohibido) return prohibido;
		const existente = id ? bd.usuarios.find((u) => u.run === id.toUpperCase()) : null;
		if (metodo === "GET") {
			if (!id) return respuesta(200, bd.usuarios.map(usuarioApi));
			return existente ? respuesta(200, usuarioApi(existente)) : error(404, `No existe el usuario ${id}.`);
		}
		if (metodo === "POST") {
			const run = cuerpo.run.toUpperCase();
			if (bd.usuarios.some((u) => u.run === run)) return error(409, `Ya existe un usuario con el RUN ${run}.`);
			if (!correoLibre(cuerpo.correo)) return error(409, `Ya existe un usuario con el correo ${cuerpo.correo}.`);
			const nuevo = usuarioDesde(cuerpo);
			bd.usuarios.push(nuevo);
			return respuesta(201, usuarioApi(nuevo));
		}
		if (!existente) return error(404, `No existe el usuario ${id}.`);
		if (metodo === "PUT") {
			if (!correoLibre(cuerpo.correo, existente.run)) return error(409, `Ya existe un usuario con el correo ${cuerpo.correo}.`);
			Object.assign(existente, usuarioDesde(cuerpo, existente));
			return respuesta(200, usuarioApi(existente));
		}
		if (metodo === "DELETE") {
			if (bd.ordenes.some((o) => o.cliente === existente.run)) {
				return error(409, `No se puede eliminar el usuario ${existente.run}: tiene boletas.`);
			}
			bd.usuarios.splice(bd.usuarios.indexOf(existente), 1);
			return respuesta(204);
		}
	}

	if (recurso === "boletas") {
		if (metodo === "POST") return comprar(cuerpo, yo);
		if (exige) return exige;
		const visibles = bd.ordenes.filter((o) => yo.rol !== "CLIENTE" || o.cliente === yo.run);
		if (!id) return respuesta(200, visibles.map(boletaApi));
		const orden = visibles.find((o) => o.numero === id);
		return orden ? respuesta(200, boletaApi(orden)) : error(404, `No existe la boleta ${id}.`);
	}

	return error(404, `Ruta desconocida: ${metodo} ${ruta}`);
}

/** Reemplaza fetch por la API falsa. Devuelve el mock para poder inspeccionarlo. */
export function instalarApiFalsa() {
	const falso = vi.fn(async (url, opciones = {}) => {
		const ruta = new URL(url).pathname.replace(/^\/api\/v1/, "");
		const metodo = opciones.method ?? "GET";
		const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined;
		const cabeceras = opciones.headers ?? {};
		llamadas.push({ metodo, ruta, cuerpo, autorizacion: cabeceras.Authorization ?? null });
		return atender(metodo, ruta, cuerpo, quien(cabeceras));
	});
	vi.stubGlobal("fetch", falso);
	return falso;
}

/**
 * Reemplaza una coleccion de la API falsa (productos, categorias, usuarios, ordenes o itemsOrden)
 * y vuelve a cargar la copia de la interfaz. Sirve para preparar el escenario de una prueba.
 */
export function guardarDatos(clave, lista) {
	bd[clave] = clonar(lista);
	sembrarCopia();
}

/*
 * Una funcion por endpoint de la API (rutas bajo /api/v1). Devuelven el
 * resultado de peticion(): { ok, estado, datos } o { ok: false, mensaje, ... }.
 */
import { crear, eliminar, obtener, reemplazar } from "./api.js";

const ruta = (...partes) => partes.map((p) => encodeURIComponent(p)).join("/");

export const iniciarSesion = (correo, contrasena) => crear("/auth/login", { correo, contrasena });
export const registrarCuenta = (datos) => crear("/auth/registro", datos);

export const miCuenta = () => obtener("/usuarios/me");
export const editarMiCuenta = (datos) => reemplazar("/usuarios/me", datos);

export const listarProductos = () => obtener("/productos");
export const crearProducto = (datos) => crear("/productos", datos);
export const editarProducto = (sku, datos) => reemplazar(`/productos/${ruta(sku)}`, datos);
export const quitarProducto = (sku) => eliminar(`/productos/${ruta(sku)}`);

export const listarCategorias = () => obtener("/categorias");
export const crearCategoria = (datos) => crear("/categorias", datos);
export const editarCategoria = (codigo, datos) => reemplazar(`/categorias/${ruta(codigo)}`, datos);
export const quitarCategoria = (codigo) => eliminar(`/categorias/${ruta(codigo)}`);

export const listarUsuarios = () => obtener("/usuarios");
export const crearUsuario = (datos) => crear("/usuarios", datos);
export const editarUsuario = (run, datos) => reemplazar(`/usuarios/${ruta(run)}`, datos);
export const quitarUsuario = (run) => eliminar(`/usuarios/${ruta(run)}`);

export const listarBoletas = () => obtener("/boletas");
export const comprar = (datos) => crear("/boletas", datos);

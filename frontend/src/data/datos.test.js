import { baseDeDatos, llamadas } from "../testing/apiFalsa.js";
import { SESION_ADMIN, SESION_CLIENTE, sesionDe } from "../testUtils.jsx";
import * as datos from "./datos.js";

const entrar = (sesion) => window.sessionStorage.setItem("sesion", JSON.stringify(sesion));
const rutas = () => llamadas.map((l) => `${l.metodo} ${l.ruta}`);
const CAMILA = sesionDe({ run: "123456785", nombre: "Camila", apellidos: "Soto Vera", correo: "camila@gmail.com", tipoUsuario: "CLIENTE" });

const COMPRADOR = { nombre: "Pedro Rojas", correo: "pedro@gmail.com", direccion: "Calle 1", comuna: "RM-01" };
const UNA_LINEA = [{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }];

describe("datos: carga desde la API", () => {
	beforeEach(() => datos.vaciarTodo());

	it("el catalogo llena productos y categorias con la forma de la interfaz", async () => {
		expect(datos.productos()).toEqual([]);

		const resultado = await datos.cargarCatalogo();

		expect(resultado).toEqual({ ok: true });
		expect(datos.productos().length).toBeGreaterThan(0);
		expect(datos.producto("CPU-R5-7600")).toMatchObject({ sku: "CPU-R5-7600", precio: expect.any(Number) });
		expect(datos.producto("CPU-R5-7600")).not.toHaveProperty("nombreCategoria");
		expect(datos.categoria("cpu")).toMatchObject({ codigo: "cpu", orden: 1 });
	});

	it("si la API falla devuelve el motivo y no toca lo que ya habia", async () => {
		await datos.cargarCatalogo();
		const antes = datos.productos();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

		const resultado = await datos.cargarCatalogo();

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toMatch(/No se pudo conectar/);
		expect(datos.productos()).toBe(antes);
	});

	it("un cliente recibe solo sus boletas, convertidas a ordenes e items", async () => {
		entrar(CAMILA);

		await datos.cargarPrivados(CAMILA);

		expect(datos.ordenes().length).toBeGreaterThan(0);
		expect(datos.ordenes().every((o) => o.cliente === "123456785")).toBe(true);
		expect(datos.usuarios()).toEqual([]);
		const numero = datos.ordenes()[0].numero;
		expect(datos.itemsDeOrden(numero).length).toBeGreaterThan(0);
		expect(datos.totalOrden(numero)).toBe(datos.subtotalOrden(numero) + datos.orden(numero).costoEnvio);
	});

	it("un administrador recibe ademas los usuarios, sin contrasena", async () => {
		entrar(SESION_ADMIN);

		await datos.cargarPrivados(SESION_ADMIN);

		expect(datos.usuarios().length).toBeGreaterThan(0);
		expect(datos.usuarios()[0]).not.toHaveProperty("contrasena");
		expect(rutas()).toContain("GET /usuarios");
	});

	it("vaciarPrivados deja el catalogo y descarta usuarios y boletas", async () => {
		entrar(SESION_ADMIN);
		await datos.cargarCatalogo();
		await datos.cargarPrivados(SESION_ADMIN);

		datos.vaciarPrivados();

		expect(datos.productos().length).toBeGreaterThan(0);
		expect(datos.usuarios()).toEqual([]);
		expect(datos.ordenes()).toEqual([]);
		expect(datos.itemsOrden()).toEqual([]);
	});

	it("el nombre del cliente sale del usuario o, si no se cargaron usuarios, del nombre de su boleta", async () => {
		entrar(CAMILA);
		await datos.cargarPrivados(CAMILA);

		expect(datos.nombreCliente("123456785")).toBe("Camila Soto Vera");
		expect(datos.nombreCliente("999")).toBe("999");
	});
});

describe("datos: escrituras", () => {
	beforeEach(async () => {
		entrar(SESION_ADMIN);
		await datos.cargarCatalogo();
		await datos.cargarPrivados(SESION_ADMIN);
		llamadas.length = 0;
	});

	it("crear un producto lo manda a la API y vuelve a leer el catalogo", async () => {
		const resultado = await datos.crearProducto({
			sku: "TST-1", nombre: "Prueba", descripcion: "", precio: "1500", descuento: "", stock: "3", stockCritico: "", categoria: "cpu",
		});

		expect(resultado).toMatchObject({ ok: true, mensaje: "El producto TST-1 se creo correctamente." });
		expect(rutas()).toEqual(["POST /productos", "GET /productos", "GET /categorias"]);
		expect(llamadas[0].cuerpo).toMatchObject({ precio: 1500, descuento: null, stock: 3, stockCritico: null });
		expect(datos.producto("TST-1")).toMatchObject({ precio: 1500, descuento: "" });
	});

	it("un rechazo del servidor no cambia la copia y trae su mensaje", async () => {
		const antes = datos.productos();

		const resultado = await datos.crearProducto({ sku: "CPU-R5-7600", nombre: "Otro", precio: 1, stock: 1, categoria: "cpu" });

		expect(resultado).toEqual({ ok: false, mensaje: "Ya existe un producto con el codigo CPU-R5-7600." });
		expect(datos.productos()).toBe(antes);
	});

	it("actualizar un producto usa el SKU de la ruta aunque el cuerpo traiga otro", async () => {
		const existente = datos.producto("CPU-R5-7600");

		await datos.actualizarProducto("CPU-R5-7600", { ...existente, sku: "OTRO", nombre: "Renombrado" });

		expect(llamadas[0]).toMatchObject({ metodo: "PUT", ruta: "/productos/CPU-R5-7600", cuerpo: { sku: "CPU-R5-7600" } });
		expect(datos.producto("CPU-R5-7600").nombre).toBe("Renombrado");
	});

	it("eliminar un producto que figura en boletas lo rechaza el servidor", async () => {
		const resultado = await datos.eliminarProducto("CPU-R5-7600");

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toMatch(/figura en boletas/);
		expect(datos.producto("CPU-R5-7600")).toBeDefined();
	});

	it("crear un usuario envia la region deducida y recarga los usuarios", async () => {
		const resultado = await datos.crearUsuario({
			run: "111111111", nombre: "Ana", apellidos: "Pinto", correo: "ana@gmail.com", contrasena: "ana1234",
			fechaNacimiento: "", comuna: "RM-01", direccion: "Calle 1", tipoUsuario: "LOGISTICA",
		});

		expect(resultado.ok).toBe(true);
		expect(llamadas[0].cuerpo).toMatchObject({ region: "RM", fechaNacimiento: null, tipoUsuario: "LOGISTICA" });
		expect(datos.usuario("111111111")).toMatchObject({ tipoUsuario: "LOGISTICA" });
	});

	it("no se elimina la propia cuenta y ni siquiera se llama a la API", async () => {
		const resultado = await datos.eliminarUsuario("123456785", "123456785");

		expect(resultado).toEqual({ ok: false, mensaje: "No puedes eliminar tu propia cuenta mientras tienes la sesion iniciada." });
		expect(llamadas).toEqual([]);
	});

	it("un usuario con boletas no se elimina: lo rechaza el servidor", async () => {
		const resultado = await datos.eliminarUsuario("123456785", "190110222");

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toMatch(/tiene boletas/);
	});

	it("una categoria nueva se crea sin paso del asistente", async () => {
		await datos.crearCategoria({ codigo: "sillas", nombre: "Sillas gamer", orden: 9 });

		expect(llamadas[0].cuerpo).toEqual({ codigo: "sillas", nombre: "Sillas gamer", orden: null });
		expect(datos.categoria("sillas")).toMatchObject({ nombre: "Sillas gamer", orden: null });
	});

	it("editar una categoria solo cambia el nombre y reenvia su paso del asistente", async () => {
		await datos.actualizarCategoria("ram", { codigo: "otro", nombre: "Memorias", orden: 99 });

		expect(llamadas[0]).toMatchObject({ metodo: "PUT", ruta: "/categorias/ram", cuerpo: { codigo: "ram", nombre: "Memorias", orden: 3 } });
	});

	it("una categoria que es paso del asistente no se elimina, sin llamar a la API", async () => {
		const resultado = await datos.eliminarCategoria("cpu");

		expect(resultado.mensaje).toMatch(/es el paso 1 del asistente/);
		expect(llamadas).toEqual([]);
	});

	it("una categoria con productos no se elimina, sin llamar a la API", async () => {
		await datos.crearCategoria({ codigo: "sillas", nombre: "Sillas" });
		await datos.crearProducto({ sku: "SILLA-1", nombre: "Silla", precio: 1, stock: 1, categoria: "sillas" });
		llamadas.length = 0;

		const resultado = await datos.eliminarCategoria("sillas");

		expect(resultado.mensaje).toMatch(/tiene 1 producto/);
		expect(llamadas).toEqual([]);
	});

	it("una categoria vacia y fuera del asistente se elimina", async () => {
		await datos.crearCategoria({ codigo: "sillas", nombre: "Sillas" });

		const resultado = await datos.eliminarCategoria("sillas");

		expect(resultado.ok).toBe(true);
		expect(datos.categoria("sillas")).toBeUndefined();
	});
});

describe("datos: comprar", () => {
	beforeEach(async () => {
		await datos.cargarCatalogo();
		llamadas.length = 0;
	});

	it("sin lineas no llama a la API", async () => {
		const resultado = await datos.crearOrden({ comprador: COMPRADOR, entrega: "RETIRO", medioPago: "Sin pago", lineas: [] });

		expect(resultado).toEqual({ ok: false, mensaje: "No hay productos para comprar." });
		expect(llamadas).toEqual([]);
	});

	it("un invitado compra sin token, el servidor descuenta el stock y la boleta queda a mano", async () => {
		const stock = datos.producto("PER-MOUSE-RGB").stock;

		const resultado = await datos.crearOrden({ comprador: COMPRADOR, entrega: "DOMICILIO", medioPago: "Tarjeta terminada en 4242", lineas: UNA_LINEA });

		expect(resultado.ok).toBe(true);
		const { numero } = resultado.registro;
		expect(llamadas.find((l) => l.metodo === "POST").autorizacion).toBeNull();
		expect(datos.producto("PER-MOUSE-RGB").stock).toBe(stock - 1);
		expect(datos.orden(numero)).toMatchObject({ cliente: "", costoEnvio: 4990 });
		expect(datos.itemsDeOrden(numero)).toEqual([{ orden: numero, producto: "PER-MOUSE-RGB", cantidad: 1, precioUnitario: expect.any(Number) }]);
		// Un invitado no recibe sus boletas de la API: la recien comprada se recuerda aparte.
		expect(rutas()).not.toContain("GET /boletas");
		expect(window.sessionStorage.getItem("ultimaBoleta")).toContain(numero);
	});

	it("una boleta guardada ilegible se ignora, y si no se puede guardar la compra igual se registra", async () => {
		window.sessionStorage.setItem("ultimaBoleta", "{no es json");
		expect(datos.orden("ORD-9999-0001")).toBeUndefined();

		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("lleno");
		});
		const resultado = await datos.crearOrden({ comprador: COMPRADOR, entrega: "RETIRO", medioPago: "Sin pago", lineas: UNA_LINEA });

		expect(resultado.ok).toBe(true);
		expect(error).toHaveBeenCalledWith("datos: no se pudo guardar la boleta", expect.any(Error));
		vi.restoreAllMocks();
	});

	it("cerrar sesion (vaciarPrivados) olvida la boleta guardada", async () => {
		const { registro } = await datos.crearOrden({ comprador: COMPRADOR, entrega: "RETIRO", medioPago: "Sin pago", lineas: UNA_LINEA });

		datos.vaciarPrivados();

		expect(datos.orden(registro.numero)).toBeUndefined();
		expect(datos.itemsDeOrden(registro.numero)).toEqual([]);
	});

	it("con sesion la compra va con el token y la boleta queda a nombre de la cuenta", async () => {
		entrar(CAMILA);

		const { registro } = await datos.crearOrden({ comprador: COMPRADOR, entrega: "RETIRO", medioPago: "Sin pago", lineas: UNA_LINEA });

		expect(llamadas.find((l) => l.metodo === "POST").autorizacion).toBe("Bearer CLIENTE:123456785");
		expect(registro.cliente).toBe("123456785");
		expect(rutas()).toContain("GET /boletas");
		expect(datos.ordenes().some((o) => o.numero === registro.numero)).toBe(true);
	});

	it("sin stock el servidor rechaza, no se guarda boleta y el catalogo se vuelve a leer", async () => {
		baseDeDatos().productos.find((p) => p.sku === "PER-MOUSE-RGB").stock = 0;

		const resultado = await datos.crearOrden({ comprador: COMPRADOR, entrega: "RETIRO", medioPago: "Sin pago", lineas: UNA_LINEA });

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toMatch(/Sin stock suficiente/);
		expect(window.sessionStorage.getItem("ultimaBoleta")).toBeNull();
		expect(datos.producto("PER-MOUSE-RGB").stock).toBe(0);
	});

	it("un rol sin sesion valida no puede escribir en el catalogo", async () => {
		entrar(SESION_CLIENTE);

		const resultado = await datos.crearCategoria({ codigo: "nueva", nombre: "Nueva" });

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toMatch(/permiso/);
	});
});

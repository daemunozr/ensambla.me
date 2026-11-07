import {
	actualizarCategoria,
	actualizarProducto,
	actualizarUsuario,
	categoria,
	categorias,
	categoriasDeArmado,
	comunasDe,
	crearCategoria,
	crearOrden,
	crearProducto,
	crearUsuario,
	eliminarCategoria,
	eliminarProducto,
	eliminarUsuario,
	itemsDeOrden,
	nombreCategoria,
	nombreCliente,
	nombreComuna,
	nombreRegionDeComuna,
	nombreRol,
	orden,
	ordenes,
	ordenesDe,
	producto,
	productos,
	productosDe,
	subtotalOrden,
	totalOrden,
	usuario,
	usuarios,
} from "./datos.js";

const CLIENTE = "123456785"; // Camila: cliente con ordenes en la semilla.

const productoNuevo = (cambios = {}) => ({
	sku: "NUEVO-1",
	nombre: "Producto nuevo",
	descripcion: "",
	precio: 1000,
	stock: 5,
	stockCritico: 2,
	categoria: "cpu",
	imagen: "",
	video: "",
	...cambios,
});

const usuarioNuevo = (cambios = {}) => ({
	run: "10000130",
	nombre: "Nuevo",
	apellidos: "Usuario",
	correo: "Nuevo@Gmail.com",
	contrasena: "clave1",
	fechaNacimiento: "2000-01-01",
	comuna: "RM-01",
	direccion: "Calle 1",
	tipoUsuario: "CLIENTE",
	...cambios,
});

beforeEach(() => {
	window.sessionStorage.clear();
});

describe("lectura", () => {
	it("la copia de trabajo parte de la semilla", () => {
		expect(productos().length).toBeGreaterThan(0);
		expect(producto("CPU-R5-7600").nombre).toBe("AMD Ryzen 5 7600");
		expect(usuario(CLIENTE).nombre).toBe("Camila");
	});

	it("nombreCategoria y nombreRol devuelven el codigo si no encuentran el nombre", () => {
		expect(nombreCategoria("cpu")).toBe("Procesadores (CPU)");
		expect(nombreCategoria("zzz")).toBe("zzz");
		expect(nombreRol("ADMIN")).toBe("Administrador");
		expect(nombreRol("ZZZ")).toBe("ZZZ");
	});

	it("nombreCliente devuelve el nombre completo o el RUN si no existe", () => {
		expect(nombreCliente(CLIENTE)).toBe("Camila Soto Vera");
		expect(nombreCliente("99999999")).toBe("99999999");
	});

	it("comunas y regiones", () => {
		expect(comunasDe("RM").length).toBeGreaterThan(0);
		expect(nombreComuna("XX-99")).toBe("");
		expect(nombreRegionDeComuna("RM-01")).not.toBe("");
	});

	it("productosDe filtra por categoria y categoriasDeArmado solo trae las del asistente", () => {
		expect(productosDe("cpu").every((p) => p.categoria === "cpu")).toBe(true);
		expect(categoriasDeArmado().every((c) => c.orden)).toBe(true);
	});

	it("las ordenes se relacionan con sus items y su cliente", () => {
		expect(ordenesDe(CLIENTE)).toHaveLength(2);
		expect(itemsDeOrden("ORD-2026-0001").length).toBeGreaterThan(0);
		expect(orden("ORD-2026-0001").cliente).toBe(CLIENTE);
	});

	it("totalOrden suma los items y el costo de envio", () => {
		const subtotal = subtotalOrden("ORD-2026-0005");
		expect(subtotal).toBeGreaterThan(0);
		expect(totalOrden("ORD-2026-0005")).toBe(subtotal + 4990);
	});
});

describe("productos", () => {
	it("crearProducto lo agrega y devuelve exito", () => {
		const resultado = crearProducto(productoNuevo());

		expect(resultado.ok).toBe(true);
		expect(resultado.mensaje).toBe("El producto NUEVO-1 se creo correctamente.");
		expect(producto("NUEVO-1")).toEqual(productoNuevo());
	});

	it("crearProducto rechaza un SKU repetido y no cambia nada", () => {
		const antes = productos().length;
		const resultado = crearProducto(productoNuevo({ sku: "CPU-R5-7600" }));

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe("Ya existe un producto con el codigo CPU-R5-7600.");
		expect(productos()).toHaveLength(antes);
	});

	it("actualizarProducto cambia los datos pero conserva el SKU", () => {
		const resultado = actualizarProducto("CPU-R5-7600", { ...producto("CPU-R5-7600"), sku: "OTRO", precio: 1 });

		expect(resultado.ok).toBe(true);
		expect(producto("CPU-R5-7600").precio).toBe(1);
		expect(producto("OTRO")).toBeUndefined();
	});

	it("actualizarProducto rechaza un SKU que no existe", () => {
		expect(actualizarProducto("NO-EXISTE", {}).ok).toBe(false);
	});

	it("eliminarProducto lo quita del catalogo", () => {
		const resultado = eliminarProducto("CPU-R5-7600");

		expect(resultado.ok).toBe(true);
		expect(resultado.mensaje).toContain("CPU-R5-7600");
		expect(producto("CPU-R5-7600")).toBeUndefined();
	});

	it("eliminarProducto rechaza un SKU que no existe", () => {
		expect(eliminarProducto("NO-EXISTE")).toEqual({ ok: false, mensaje: "No existe un producto con el codigo NO-EXISTE." });
	});
});

describe("usuarios", () => {
	it("crearUsuario guarda el RUN en mayusculas y el correo en minusculas", () => {
		const resultado = crearUsuario(usuarioNuevo({ run: "1000005k" }));

		expect(resultado.ok).toBe(true);
		expect(usuario("1000005K").correo).toBe("nuevo@gmail.com");
	});

	it("crearUsuario rechaza un RUN repetido", () => {
		const resultado = crearUsuario(usuarioNuevo({ run: CLIENTE }));
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe(`Ya existe un usuario con RUN ${CLIENTE}.`);
	});

	it("crearUsuario rechaza un correo repetido sin distinguir mayusculas", () => {
		const resultado = crearUsuario(usuarioNuevo({ correo: "CAMILA@gmail.com" }));
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("ya esta usado");
	});

	it("actualizarUsuario cambia los datos y conserva el RUN", () => {
		const resultado = actualizarUsuario(CLIENTE, { ...usuario(CLIENTE), run: "otro", nombre: "Camilita" });

		expect(resultado.ok).toBe(true);
		expect(usuario(CLIENTE).nombre).toBe("Camilita");
		expect(usuario("otro")).toBeUndefined();
	});

	it("actualizarUsuario rechaza el correo de otro usuario pero permite conservar el propio", () => {
		expect(actualizarUsuario(CLIENTE, { ...usuario(CLIENTE), correo: "admin@duoc.cl" }).ok).toBe(false);
		expect(actualizarUsuario(CLIENTE, { ...usuario(CLIENTE) }).ok).toBe(true);
	});

	it("actualizarUsuario rechaza un RUN que no existe", () => {
		expect(actualizarUsuario("99999999", usuarioNuevo()).ok).toBe(false);
	});

	it("eliminarUsuario quita a un usuario sin ordenes", () => {
		crearUsuario(usuarioNuevo());
		const resultado = eliminarUsuario("10000130");

		expect(resultado.ok).toBe(true);
		expect(usuario("10000130")).toBeUndefined();
	});

	it("eliminarUsuario rechaza la cuenta con la sesion iniciada", () => {
		crearUsuario(usuarioNuevo());
		const resultado = eliminarUsuario("10000130", "10000130");

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("tu propia cuenta");
		expect(usuario("10000130")).toBeDefined();
	});

	it("eliminarUsuario rechaza a quien tiene ordenes", () => {
		const resultado = eliminarUsuario(CLIENTE);

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("tiene 2 ordenes a su nombre");
		expect(usuarios().some((u) => u.run === CLIENTE)).toBe(true);
	});

	it("eliminarUsuario rechaza un RUN que no existe", () => {
		expect(eliminarUsuario("99999999").ok).toBe(false);
	});
});

describe("categorias", () => {
	it("crearCategoria agrega solo el codigo y el nombre", () => {
		const resultado = crearCategoria({ codigo: "cables", nombre: "Cables", orden: 5 });

		expect(resultado.ok).toBe(true);
		expect(categoria("cables")).toEqual({ codigo: "cables", nombre: "Cables" });
	});

	it("crearCategoria rechaza un codigo repetido", () => {
		expect(crearCategoria({ codigo: "cpu", nombre: "Otra" }).ok).toBe(false);
	});

	it("actualizarCategoria cambia solo el nombre", () => {
		const resultado = actualizarCategoria("cpu", { codigo: "otro", nombre: "Procesadores", orden: 99 });

		expect(resultado.ok).toBe(true);
		expect(categoria("cpu")).toEqual({ codigo: "cpu", nombre: "Procesadores", orden: 1 });
	});

	it("actualizarCategoria rechaza un codigo que no existe", () => {
		expect(actualizarCategoria("zzz", { nombre: "X" }).ok).toBe(false);
	});

	it("eliminarCategoria quita una categoria nueva sin productos", () => {
		crearCategoria({ codigo: "cables", nombre: "Cables" });
		const antes = categorias().length;

		expect(eliminarCategoria("cables").ok).toBe(true);
		expect(categorias()).toHaveLength(antes - 1);
	});

	it("eliminarCategoria rechaza una del asistente de armado", () => {
		const resultado = eliminarCategoria("cpu");
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("paso 1 del asistente");
	});

	it("eliminarCategoria rechaza una categoria con productos", () => {
		crearCategoria({ codigo: "cables", nombre: "Cables" });
		crearProducto(productoNuevo({ categoria: "cables" }));

		const resultado = eliminarCategoria("cables");

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("tiene 1 producto");
	});

	it("eliminarCategoria rechaza un codigo que no existe", () => {
		expect(eliminarCategoria("zzz").ok).toBe(false);
	});
});

describe("crearOrden", () => {
	const peticion = (cambios = {}) => ({
		cliente: CLIENTE,
		comprador: { nombre: "Camila Soto", correo: "CAMILA@gmail.com", direccion: "Calle 1", comuna: "RM-04" },
		entrega: "DOMICILIO",
		medioPago: "Tarjeta terminada en 4242",
		lineas: [{ producto: "PER-MOUSE-RGB", cantidad: 2 }],
		...cambios,
	});

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 9, 27, 12));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("registra la orden con el siguiente numero y la fecha de hoy", () => {
		const resultado = crearOrden(peticion());

		expect(resultado.ok).toBe(true);
		expect(resultado.registro).toMatchObject({
			numero: "ORD-2026-0008",
			cliente: CLIENTE,
			fecha: "2026-10-27",
			correo: "camila@gmail.com",
			entrega: "DOMICILIO",
		});
		expect(orden("ORD-2026-0008")).toBeDefined();
	});

	it("guarda los items con el precio vigente", () => {
		crearOrden(peticion());
		expect(itemsDeOrden("ORD-2026-0008")).toEqual([{ orden: "ORD-2026-0008", producto: "PER-MOUSE-RGB", cantidad: 2, precioUnitario: 24990 }]);
	});

	it("descuenta el stock de cada producto", () => {
		const antes = producto("PER-MOUSE-RGB").stock;
		crearOrden(peticion());
		expect(producto("PER-MOUSE-RGB").stock).toBe(antes - 2);
	});

	it("cobra el envio a domicilio bajo el monto gratis y no lo cobra en el retiro", () => {
		expect(crearOrden(peticion()).registro.costoEnvio).toBe(4990);
		expect(crearOrden(peticion({ entrega: "RETIRO" })).registro.costoEnvio).toBe(0);
	});

	it("los numeros siguientes son correlativos", () => {
		crearOrden(peticion());
		expect(crearOrden(peticion()).registro.numero).toBe("ORD-2026-0009");
	});

	it("una compra de invitado no tiene cliente", () => {
		const resultado = crearOrden(peticion({ cliente: "" }));
		expect(resultado.ok).toBe(true);
		expect(resultado.registro.cliente).toBe("");
	});

	it("rechaza una compra sin productos", () => {
		expect(crearOrden(peticion({ lineas: [] }))).toEqual({ ok: false, mensaje: "No hay productos para comprar." });
	});

	it("rechaza una entrega desconocida", () => {
		expect(crearOrden(peticion({ entrega: "DRON" })).mensaje).toBe("Elige una opcion de entrega valida.");
	});

	it("rechaza una cuenta que ya no existe", () => {
		expect(crearOrden(peticion({ cliente: "99999999" })).mensaje).toBe("La cuenta con la que compras ya no existe.");
	});

	it("rechaza la compra sin stock suficiente y no cambia nada", () => {
		const ordenesAntes = ordenes().length;
		const stockAntes = producto("PER-MOUSE-RGB").stock;

		const resultado = crearOrden(peticion({ lineas: [{ producto: "PER-MOUSE-RGB", cantidad: 9999 }] }));

		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("Sin stock suficiente");
		expect(ordenes()).toHaveLength(ordenesAntes);
		expect(producto("PER-MOUSE-RGB").stock).toBe(stockAntes);
	});
});

import {
	boletaDeApi,
	boletaParaApi,
	categoriaParaApi,
	perfilParaApi,
	productoDeApi,
	productoParaApi,
	registroParaApi,
	usuarioDeApi,
	usuarioParaApi,
} from "./adaptadores.js";

describe("productos", () => {
	it("de la API: deja los textos y numeros opcionales como cadena vacia y quita el nombre de la categoria", () => {
		const producto = productoDeApi({
			sku: "A", nombre: "Uno", descripcion: null, precio: "1000.00", descuento: null, stock: 5, stockCritico: null,
			imagen: null, video: null, categoria: "cpu", nombreCategoria: "Procesadores",
		});

		expect(producto).toEqual({
			sku: "A", nombre: "Uno", descripcion: "", precio: 1000, descuento: "", stock: 5, stockCritico: "",
			imagen: "", video: "", categoria: "cpu",
		});
	});

	it("hacia la API: los vacios pasan a null y los numeros a numeros", () => {
		const cuerpo = productoParaApi({
			sku: "A", nombre: "Uno", descripcion: "", precio: "1000", descuento: "", stock: "5", stockCritico: "", imagen: "", video: "", categoria: "cpu",
		});

		expect(cuerpo).toEqual({
			sku: "A", nombre: "Uno", descripcion: null, precio: 1000, descuento: null, stock: 5, stockCritico: null,
			imagen: null, video: null, categoria: "cpu",
		});
	});

	it("hacia la API: un descuento de 0 se conserva", () => {
		expect(productoParaApi({ sku: "A", precio: 1, stock: 1, descuento: 0 }).descuento).toBe(0);
	});
});

describe("categorias", () => {
	it("hacia la API: reenvia el orden y manda null si no tiene", () => {
		expect(categoriaParaApi({ codigo: "ram", nombre: "RAM", orden: 3 })).toEqual({ codigo: "ram", nombre: "RAM", orden: 3 });
		expect(categoriaParaApi({ codigo: "x", nombre: "X" })).toEqual({ codigo: "x", nombre: "X", orden: null });
	});
});

describe("usuarios", () => {
	const camila = {
		run: "123456785", nombre: "Camila", apellidos: "Soto", correo: "camila@gmail.com", contrasena: "cliente123",
		fechaNacimiento: "", comuna: "RM-04", direccion: "Calle 1", tipoUsuario: "CLIENTE",
	};

	it("de la API: una fecha ausente queda vacia", () => {
		expect(usuarioDeApi({ ...camila, fechaNacimiento: null }).fechaNacimiento).toBe("");
	});

	it("hacia la API: deduce la region de la comuna y manda null sin fecha", () => {
		expect(usuarioParaApi(camila)).toMatchObject({ region: "RM", comuna: "RM-04", fechaNacimiento: null, tipoUsuario: "CLIENTE" });
	});

	it("hacia la API: una comuna desconocida deja la region vacia", () => {
		expect(usuarioParaApi({ ...camila, comuna: "XX-99" }).region).toBe("");
	});

	it("el registro no lleva tipo de usuario: el servidor siempre crea un Cliente", () => {
		expect(registroParaApi(camila)).not.toHaveProperty("tipoUsuario");
	});

	it("el perfil no lleva RUN, rol ni contrasena propia, y las contrasenas vacias van como null", () => {
		const cuerpo = perfilParaApi({ ...camila, contrasenaActual: "", contrasenaNueva: "" });

		expect(cuerpo).toEqual({
			nombre: "Camila", apellidos: "Soto", correo: "camila@gmail.com", fechaNacimiento: null, region: "RM",
			comuna: "RM-04", direccion: "Calle 1", contrasenaActual: null, contrasenaNueva: null,
		});
	});

	it("el perfil con cambio de contrasena manda las dos", () => {
		expect(perfilParaApi({ ...camila, contrasenaActual: "a", contrasenaNueva: "b" })).toMatchObject({ contrasenaActual: "a", contrasenaNueva: "b" });
	});
});

describe("boletas", () => {
	const boleta = {
		numero: "ORD-2026-0001", usuario: null, fecha: "2026-05-01", nombre: "Pedro", correo: "p@gmail.com", direccion: "Calle 1",
		comuna: "RM-01", entrega: "RETIRO", medioPago: "Sin pago",
		detalles: [{ sku: "A", nombreProducto: "Uno", cantidad: 2, precioUnitario: "1500.00", subtotal: "3000.00" }],
		subtotal: "3000.00", costoEnvio: "0.00", total: "3000.00", neto: "2521.00", iva: "479.00",
	};

	it("de la API: separa la orden de sus items con la forma de la interfaz", () => {
		const { orden, items } = boletaDeApi(boleta);

		expect(orden).toEqual({
			numero: "ORD-2026-0001", cliente: "", fecha: "2026-05-01", nombre: "Pedro", correo: "p@gmail.com",
			direccion: "Calle 1", comuna: "RM-01", entrega: "RETIRO", costoEnvio: 0, medioPago: "Sin pago",
		});
		expect(items).toEqual([{ orden: "ORD-2026-0001", producto: "A", cantidad: 2, precioUnitario: 1500 }]);
	});

	it("de la API: una compra con cuenta conserva el RUN como cliente", () => {
		expect(boletaDeApi({ ...boleta, usuario: "123456785" }).orden.cliente).toBe("123456785");
	});

	it("hacia la API: suma las lineas con el mismo SKU y no manda precios, envio ni cliente", () => {
		const cuerpo = boletaParaApi({
			comprador: { nombre: "Pedro", correo: "p@gmail.com", direccion: "Calle 1", comuna: "RM-01" },
			entrega: "RETIRO",
			medioPago: "Sin pago",
			lineas: [
				{ linea: 1, producto: "A", cantidad: 1, armado: null },
				{ linea: 2, producto: "B", cantidad: 2, armado: "ARM-1" },
				{ linea: 3, producto: "A", cantidad: 2, armado: "ARM-1" },
			],
		});

		expect(cuerpo).toEqual({
			nombre: "Pedro", correo: "p@gmail.com", direccion: "Calle 1", comuna: "RM-01", entrega: "RETIRO", medioPago: "Sin pago",
			lineas: [{ sku: "A", cantidad: 3 }, { sku: "B", cantidad: 2 }],
		});
	});
});

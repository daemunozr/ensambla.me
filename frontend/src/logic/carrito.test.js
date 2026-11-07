import {
	agregarArmado,
	agregarProducto,
	agrupar,
	cambiarCantidad,
	cantidadItems,
	disponible,
	eliminarArmado,
	eliminarLinea,
	normalizar,
	subtotal,
	total,
	unidadesEnCarrito,
	vaciar,
} from "./carrito.js";

const catalogo = {
	A: { sku: "A", nombre: "Procesador", precio: 1000, stock: 5 },
	B: { sku: "B", nombre: "Placa", precio: 2000, stock: 1 },
	C: { sku: "C", nombre: "Gabinete", precio: 3000, stock: 0 },
};
const buscar = (sku) => catalogo[sku];
const linea = (numero, producto, cantidad, armado = null) => ({ linea: numero, producto, cantidad, armado });

describe("normalizar", () => {
	it("rechaza un carrito que no es un arreglo", () => {
		expect(() => normalizar("no", buscar)).toThrow("el carrito no es un arreglo");
	});

	it("descarta lineas mal formadas y de productos que no existen", () => {
		const resultado = normalizar([null, { producto: 3 }, { producto: "Z", cantidad: 1 }, { producto: "A", cantidad: 2 }], buscar);
		expect(resultado).toEqual([linea(1, "A", 2)]);
	});

	it("ajusta la cantidad al stock y la deja en 1 si es invalida", () => {
		expect(normalizar([{ producto: "A", cantidad: 99 }], buscar)[0].cantidad).toBe(5);
		expect(normalizar([{ producto: "A", cantidad: "x" }], buscar)[0].cantidad).toBe(1);
	});

	it("reparte el stock entre las lineas del mismo producto", () => {
		const resultado = normalizar([{ producto: "A", cantidad: 4 }, { producto: "A", cantidad: 4 }], buscar);
		expect(resultado.map((l) => l.cantidad)).toEqual([4, 1]);
	});

	it("quita la linea de un producto sin stock", () => {
		expect(normalizar([{ producto: "C", cantidad: 1 }], buscar)).toEqual([]);
	});

	it("conserva el agrupador de armado y deja null en las sueltas", () => {
		const resultado = normalizar([{ producto: "A", cantidad: 1, armado: "ARM-1" }, { producto: "A", cantidad: 1 }], buscar);
		expect(resultado.map((l) => l.armado)).toEqual(["ARM-1", null]);
	});
});

describe("consultas", () => {
	const lineas = [linea(1, "A", 2), linea(2, "B", 1), linea(3, "A", 1, "ARM-1")];

	it("cantidadItems suma las unidades de todas las lineas", () => {
		expect(cantidadItems(lineas)).toBe(4);
	});

	it("subtotal y total usan el precio vigente", () => {
		expect(subtotal(lineas[0], buscar)).toBe(2000);
		expect(total(lineas, buscar)).toBe(2000 + 2000 + 1000);
	});

	it("unidadesEnCarrito suma las lineas del producto y puede excluir una", () => {
		expect(unidadesEnCarrito(lineas, "A")).toBe(3);
		expect(unidadesEnCarrito(lineas, "A", 1)).toBe(1);
	});

	it("disponible es el stock menos lo que ya esta en el carrito", () => {
		expect(disponible(lineas, "A", null, buscar)).toBe(2);
		expect(disponible(lineas, "B", null, buscar)).toBe(0);
		expect(disponible(lineas, "Z", null, buscar)).toBe(0);
	});

	it("agrupar separa las lineas sueltas de los armados", () => {
		const { sueltas, armados } = agrupar(lineas);
		expect(sueltas.map((l) => l.linea)).toEqual([1, 2]);
		expect(armados).toEqual({ "ARM-1": [lineas[2]] });
	});
});

describe("agregarProducto", () => {
	it("agrega un producto nuevo", () => {
		const resultado = agregarProducto([], "A", 1, buscar);
		expect(resultado.ok).toBe(true);
		expect(resultado.lineas).toEqual([linea(1, "A", 1)]);
		expect(resultado.mensaje).toBe('"Procesador" se agrego al carrito.');
	});

	it("suma la cantidad si el producto ya esta suelto", () => {
		const resultado = agregarProducto([linea(1, "A", 2)], "A", 1, buscar);
		expect(resultado.lineas).toEqual([linea(1, "A", 3)]);
	});

	it("rechaza un producto que no existe", () => {
		const resultado = agregarProducto([], "Z", 1, buscar);
		expect(resultado).toEqual({ ok: false, lineas: [], mensaje: 'No existe el producto "Z".' });
	});

	it("rechaza un producto sin stock", () => {
		const resultado = agregarProducto([], "C", 1, buscar);
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe('"Gabinete" no tiene stock disponible.');
	});

	it("avisa cuando ya esta todo el stock en el carrito", () => {
		const resultado = agregarProducto([linea(1, "A", 5)], "A", 1, buscar);
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe('Ya tienes en el carrito todo el stock de "Procesador" (5 unidades).');
	});

	it("avisa cuantas unidades quedan cuando se pide mas de lo disponible", () => {
		const resultado = agregarProducto([linea(1, "A", 4)], "A", 2, buscar);
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe('Solo queda 1 unidad de "Procesador" y ya tienes 4 en el carrito.');
	});

	it("si falla devuelve las mismas lineas", () => {
		const lineas = [linea(1, "A", 5)];
		expect(agregarProducto(lineas, "A", 1, buscar).lineas).toBe(lineas);
	});
});

describe("agregarArmado", () => {
	it("agrega una linea por componente con el mismo agrupador", () => {
		const resultado = agregarArmado([], ["A", "B"], "ARM-1", buscar);
		expect(resultado.ok).toBe(true);
		expect(resultado.lineas).toEqual([linea(1, "A", 1, "ARM-1"), linea(2, "B", 1, "ARM-1")]);
		expect(resultado.mensaje).toBe("Armado agregado al carrito con 2 componentes.");
	});

	it("usa el singular con un solo componente", () => {
		expect(agregarArmado([], ["A"], "ARM-1", buscar).mensaje).toBe("Armado agregado al carrito con 1 componente.");
	});

	it("rechaza un armado sin componentes", () => {
		const resultado = agregarArmado([], [], "ARM-1", buscar);
		expect(resultado).toEqual({ ok: false, lineas: [], mensaje: "El armado no tiene componentes." });
	});

	it("si falta stock de un componente no agrega nada", () => {
		const lineas = [];
		const resultado = agregarArmado(lineas, ["A", "C"], "ARM-1", buscar);
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toBe("Sin stock suficiente para: Gabinete. El armado no se agrego.");
		expect(resultado.lineas).toBe(lineas);
	});

	it("un componente repetido cuenta contra su stock", () => {
		const resultado = agregarArmado([], ["B", "B"], "ARM-1", buscar);
		expect(resultado.ok).toBe(false);
		expect(resultado.mensaje).toContain("Placa");
	});
});

describe("cambiarCantidad", () => {
	const lineas = [linea(1, "A", 1)];

	it("cambia la cantidad dentro del stock", () => {
		const resultado = cambiarCantidad(lineas, 1, 3, buscar);
		expect(resultado.lineas[0].cantidad).toBe(3);
		expect(resultado.mensaje).toBe("");
	});

	it("no pasa del stock y lo avisa", () => {
		const resultado = cambiarCantidad(lineas, 1, 99, buscar);
		expect(resultado.lineas[0].cantidad).toBe(5);
		expect(resultado.mensaje).toBe('Solo puedes llevar 5 unidades de "Procesador".');
	});

	it("nunca baja de 1", () => {
		expect(cambiarCantidad(lineas, 1, 0, buscar).lineas[0].cantidad).toBe(1);
	});

	it("una linea que no existe no cambia nada", () => {
		expect(cambiarCantidad(lineas, 9, 2, buscar)).toEqual({ ok: false, lineas, mensaje: "" });
	});
});

describe("eliminar y vaciar", () => {
	const lineas = [linea(1, "A", 1), linea(2, "B", 1, "ARM-1"), linea(3, "A", 1, "ARM-1")];

	it("eliminarLinea quita la linea y vuelve a numerar", () => {
		expect(eliminarLinea(lineas, 1).map((l) => l.linea)).toEqual([1, 2]);
		expect(eliminarLinea(lineas, 1).map((l) => l.producto)).toEqual(["B", "A"]);
	});

	it("eliminarArmado quita todas las lineas del armado", () => {
		expect(eliminarArmado(lineas, "ARM-1")).toEqual([linea(1, "A", 1)]);
	});

	it("vaciar devuelve un carrito sin lineas", () => {
		expect(vaciar()).toEqual([]);
	});
});

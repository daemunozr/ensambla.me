import { ORDENES, aParametros, filtrar, hayFiltros, leerCriterios, ordenar } from "./catalogo.js";

const sinCriterios = { q: "", categoria: "", min: null, max: null, oferta: false, stock: false, orden: "" };
const criterios = (cambios) => ({ ...sinCriterios, ...cambios });
const nombreDeCategoria = (codigo) => ({ cpu: "Procesadores", ram: "Memoria RAM" })[codigo] ?? codigo;

describe("leerCriterios", () => {
	it("lee los criterios de los parametros de la URL", () => {
		const parametros = new URLSearchParams("q= ram &categoria=cpu&min=100&max=900&oferta=1&stock=1&orden=nombre");
		expect(leerCriterios(parametros)).toEqual({
			q: "ram",
			categoria: "cpu",
			min: 100,
			max: 900,
			oferta: true,
			stock: true,
			orden: "nombre",
		});
	});

	it("sin parametros devuelve los criterios vacios", () => {
		expect(leerCriterios(new URLSearchParams())).toEqual(sinCriterios);
	});

	it("ignora los precios negativos o no numericos", () => {
		const resultado = leerCriterios(new URLSearchParams("min=-5&max=abc"));
		expect(resultado.min).toBeNull();
		expect(resultado.max).toBeNull();
	});

	it("ignora un orden desconocido y usa el inicial", () => {
		expect(leerCriterios(new URLSearchParams("orden=raro"), "precio-asc").orden).toBe("precio-asc");
	});
});

describe("aParametros", () => {
	it("omite lo vacio y escribe true como 1", () => {
		const parametros = aParametros({ q: " ram ", categoria: "", oferta: true, stock: false, min: 0, max: null });
		expect(parametros.toString()).toBe("q=ram&oferta=1&min=0");
	});
});

describe("hayFiltros", () => {
	it("sin criterios activos es falso, aunque haya un orden", () => {
		expect(hayFiltros(criterios({ orden: "nombre" }))).toBe(false);
	});

	it("cualquier criterio activo lo vuelve verdadero", () => {
		expect(hayFiltros(criterios({ q: "ram" }))).toBe(true);
		expect(hayFiltros(criterios({ categoria: "cpu" }))).toBe(true);
		expect(hayFiltros(criterios({ oferta: true }))).toBe(true);
		expect(hayFiltros(criterios({ stock: true }))).toBe(true);
		expect(hayFiltros(criterios({ min: 0 }))).toBe(true);
		expect(hayFiltros(criterios({ max: 100 }))).toBe(true);
	});
});

describe("filtrar", () => {
	const productos = [
		{ sku: "CPU-1", nombre: "Ryzen 5", descripcion: "Procesador", precio: 200000, descuento: 50, stock: 3, categoria: "cpu" },
		{ sku: "CPU-2", nombre: "Core i5", descripcion: "Procesador", precio: 300000, stock: 0, categoria: "cpu" },
		{ sku: "RAM-1", nombre: "DDR5 16 GB", descripcion: "Memoria", precio: 80000, stock: 10, categoria: "ram" },
	];
	const skus = (lista) => lista.map((p) => p.sku);

	it("sin criterios devuelve todo", () => {
		expect(skus(filtrar(productos, sinCriterios, nombreDeCategoria))).toEqual(["CPU-1", "CPU-2", "RAM-1"]);
	});

	it("filtra por categoria", () => {
		expect(skus(filtrar(productos, criterios({ categoria: "ram" }), nombreDeCategoria))).toEqual(["RAM-1"]);
	});

	it("filtra por ofertas", () => {
		expect(skus(filtrar(productos, criterios({ oferta: true }), nombreDeCategoria))).toEqual(["CPU-1"]);
	});

	it("filtra por productos con stock", () => {
		expect(skus(filtrar(productos, criterios({ stock: true }), nombreDeCategoria))).toEqual(["CPU-1", "RAM-1"]);
	});

	it("filtra por el precio vigente, no por el de lista", () => {
		// CPU-1 cuesta 200000 de lista pero 100000 con la oferta.
		expect(skus(filtrar(productos, criterios({ max: 100000 }), nombreDeCategoria))).toEqual(["CPU-1", "RAM-1"]);
		expect(skus(filtrar(productos, criterios({ min: 90000, max: 150000 }), nombreDeCategoria))).toEqual(["CPU-1"]);
	});

	it("busca en el nombre, el SKU, la descripcion y el nombre de la categoria", () => {
		expect(skus(filtrar(productos, criterios({ q: "ryzen" }), nombreDeCategoria))).toEqual(["CPU-1"]);
		expect(skus(filtrar(productos, criterios({ q: "ram-1" }), nombreDeCategoria))).toEqual(["RAM-1"]);
		expect(skus(filtrar(productos, criterios({ q: "memoria" }), nombreDeCategoria))).toEqual(["RAM-1"]);
		expect(skus(filtrar(productos, criterios({ q: "procesadores" }), nombreDeCategoria))).toEqual(["CPU-1", "CPU-2"]);
	});

	it("combina todos los criterios", () => {
		expect(skus(filtrar(productos, criterios({ categoria: "cpu", stock: true, oferta: true }), nombreDeCategoria))).toEqual([
			"CPU-1",
		]);
	});
});

describe("ordenar", () => {
	const productos = [
		{ sku: "B", nombre: "Zeta", precio: 200, descuento: 10 },
		{ sku: "A", nombre: "alfa", precio: 300 },
		{ sku: "C", nombre: "Medio", precio: 100, descuento: 50 },
	];
	const skus = (orden) => ordenar(productos, orden).map((p) => p.sku);

	it("por precio ascendente y descendente", () => {
		expect(skus("precio-asc")).toEqual(["C", "B", "A"]);
		expect(skus("precio-desc")).toEqual(["A", "B", "C"]);
	});

	it("por nombre", () => {
		expect(skus("nombre")).toEqual(["A", "C", "B"]);
	});

	it("por mayor descuento", () => {
		expect(skus("descuento")).toEqual(["C", "B", "A"]);
	});

	it("con un orden vacio o desconocido conserva el del catalogo", () => {
		expect(skus("")).toEqual(["B", "A", "C"]);
		expect(skus("raro")).toEqual(["B", "A", "C"]);
	});

	it("no modifica la lista recibida", () => {
		ordenar(productos, "nombre");
		expect(productos.map((p) => p.sku)).toEqual(["B", "A", "C"]);
	});
});

describe("ORDENES", () => {
	it("la primera opcion es el orden del catalogo", () => {
		expect(ORDENES[0].valor).toBe("");
	});
});

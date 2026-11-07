import {
	filtrarPorFecha,
	resumenVentas,
	topClientes,
	topProductos,
	valorInventario,
	ventasPorCategoria,
	ventasPorMes,
} from "./reportes.js";

const ordenes = [
	{ numero: "ORD-2026-0001", cliente: "11111111K", fecha: "2026-09-10", nombre: "Ana", correo: "ana@gmail.com", costoEnvio: 4990 },
	{ numero: "ORD-2026-0002", cliente: "", fecha: "2026-10-05", nombre: "Beto", correo: "Beto@gmail.com", costoEnvio: 0 },
	{ numero: "ORD-2026-0003", cliente: "11111111K", fecha: "2026-10-20", nombre: "Ana P.", correo: "ana@gmail.com", costoEnvio: 0 },
];
const items = [
	{ orden: "ORD-2026-0001", producto: "A", cantidad: 2, precioUnitario: 1000 },
	{ orden: "ORD-2026-0002", producto: "B", cantidad: 1, precioUnitario: 5000 },
	{ orden: "ORD-2026-0003", producto: "A", cantidad: 3, precioUnitario: 1000 },
	{ orden: "ORD-OTRA", producto: "A", cantidad: 99, precioUnitario: 1000 },
];
const catalogo = { A: { nombre: "Procesador", categoria: "cpu" }, B: { nombre: "Placa", categoria: "placa" } };
const buscar = (sku) => catalogo[sku];

describe("filtrarPorFecha", () => {
	const numeros = (lista) => lista.map((o) => o.numero);

	it("sin limites devuelve todas", () => {
		expect(filtrarPorFecha(ordenes)).toHaveLength(3);
	});

	it("los limites son inclusivos", () => {
		expect(numeros(filtrarPorFecha(ordenes, { desde: "2026-10-05", hasta: "2026-10-20" }))).toEqual([
			"ORD-2026-0002",
			"ORD-2026-0003",
		]);
	});

	it("cada limite es opcional", () => {
		expect(numeros(filtrarPorFecha(ordenes, { desde: "2026-10-01" }))).toHaveLength(2);
		expect(numeros(filtrarPorFecha(ordenes, { hasta: "2026-09-30" }))).toEqual(["ORD-2026-0001"]);
	});

	it("con desde posterior a hasta no hay ninguna", () => {
		expect(filtrarPorFecha(ordenes, { desde: "2026-12-01", hasta: "2026-01-01" })).toEqual([]);
	});
});

describe("resumenVentas", () => {
	it("calcula ordenes, ingresos, envios, unidades y ticket promedio", () => {
		expect(resumenVentas(ordenes, items)).toEqual({
			ordenes: 3,
			ingresos: 2000 + 4990 + 5000 + 3000,
			envios: 4990,
			unidades: 6,
			ticketPromedio: Math.round(14990 / 3),
		});
	});

	it("no cuenta los items de otras ordenes", () => {
		expect(resumenVentas([ordenes[1]], items).unidades).toBe(1);
	});

	it("sin ordenes todo es cero", () => {
		expect(resumenVentas([], items)).toEqual({ ordenes: 0, ingresos: 0, envios: 0, unidades: 0, ticketPromedio: 0 });
	});
});

describe("ventasPorMes", () => {
	it("agrupa por mes en orden cronologico", () => {
		expect(ventasPorMes([...ordenes].reverse(), items)).toEqual([
			{ mes: "2026-09", ordenes: 1, ingresos: 6990 },
			{ mes: "2026-10", ordenes: 2, ingresos: 8000 },
		]);
	});
});

describe("ventasPorCategoria", () => {
	it("ordena de mayor a menor ingreso y cuenta solo los items", () => {
		expect(ventasPorCategoria(ordenes, items, buscar)).toEqual([
			{ categoria: "cpu", unidades: 5, ingresos: 5000 },
			{ categoria: "placa", unidades: 1, ingresos: 5000 },
		]);
	});

	it("un producto que ya no esta en el catalogo queda sin categoria", () => {
		const resultado = ventasPorCategoria([ordenes[1]], items, () => undefined);
		expect(resultado).toEqual([{ categoria: "", unidades: 1, ingresos: 5000 }]);
	});
});

describe("topProductos", () => {
	it("ordena por unidades vendidas", () => {
		expect(topProductos(ordenes, items, buscar)).toEqual([
			{ producto: "A", nombre: "Procesador", unidades: 5, ingresos: 5000 },
			{ producto: "B", nombre: "Placa", unidades: 1, ingresos: 5000 },
		]);
	});

	it("limita a los n primeros", () => {
		expect(topProductos(ordenes, items, buscar, 1)).toHaveLength(1);
	});
});

describe("topClientes", () => {
	it("agrupa al cliente por RUN y al invitado por correo, de mayor a menor gasto", () => {
		const resultado = topClientes(ordenes, items);
		expect(resultado.map((c) => c.clave)).toEqual(["11111111K", "invitado:beto@gmail.com"]);
		expect(resultado[0]).toMatchObject({ ordenes: 2, gasto: 2000 + 4990 + 3000 });
	});

	it("usa el nombre de la compra mas reciente", () => {
		expect(topClientes(ordenes, items)[0].nombre).toBe("Ana P.");
	});

	it("limita a los n primeros", () => {
		expect(topClientes(ordenes, items, 1)).toHaveLength(1);
	});
});

describe("valorInventario", () => {
	it("valoriza el stock a precio de lista", () => {
		const productos = [
			{ stock: 2, precio: 1000 },
			{ stock: "3", precio: 500 },
			{ stock: "x", precio: 100 },
		];
		expect(valorInventario(productos)).toEqual({ productos: 3, unidades: 5, valor: 3500 });
	});
});

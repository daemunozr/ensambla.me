import { enStockCritico, faltante, productosCriticos } from "./stock.js";

const producto = (sku, stock, stockCritico) => ({ sku, stock, stockCritico });

describe("enStockCritico", () => {
	it("es critico cuando el stock no supera el umbral", () => {
		expect(enStockCritico(producto("A", 3, 5))).toBe(true);
		expect(enStockCritico(producto("A", 5, 5))).toBe(true);
		expect(enStockCritico(producto("A", 6, 5))).toBe(false);
	});

	it("sin umbral no hay alerta", () => {
		expect(enStockCritico(producto("A", 0, ""))).toBe(false);
		expect(enStockCritico(producto("A", 0, null))).toBe(false);
		expect(enStockCritico(producto("A", 0, undefined))).toBe(false);
	});

	it("un umbral de cero alerta solo cuando se agota", () => {
		expect(enStockCritico(producto("A", 0, 0))).toBe(true);
		expect(enStockCritico(producto("A", 1, 0))).toBe(false);
	});
});

describe("faltante", () => {
	it("son las unidades que faltan para volver al umbral", () => {
		expect(faltante(producto("A", 2, 5))).toBe(3);
	});

	it("es negativo si hay de sobra", () => {
		expect(faltante(producto("A", 9, 5))).toBe(-4);
	});
});

describe("productosCriticos", () => {
	const lista = [
		producto("D", 10, 5),
		producto("B", 1, 6),
		producto("E", 3, 3),
		producto("A", 1, 6),
		producto("C", 2, 10),
		producto("Z", 0, 5),
	];

	it("deja fuera los productos que no son criticos", () => {
		expect(productosCriticos(lista).map((p) => p.sku)).not.toContain("D");
	});

	it("ordena primero los agotados, luego el mayor faltante y a igualdad por SKU", () => {
		expect(productosCriticos(lista).map((p) => p.sku)).toEqual(["Z", "C", "A", "B", "E"]);
	});

	it("no modifica la lista recibida", () => {
		const antes = lista.map((p) => p.sku);
		productosCriticos(lista);
		expect(lista.map((p) => p.sku)).toEqual(antes);
	});
});

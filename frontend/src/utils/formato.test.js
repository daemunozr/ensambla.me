import { fecha, fechaLocal, mesLegible, precio, precioOGratis, unidades } from "./formato.js";

// Intl separa el simbolo del monto con un espacio no separable; se normaliza para comparar.
const normalizar = (texto) => texto.replace(/\s/g, " ");

describe("precio", () => {
	it("da formato de pesos chilenos sin decimales", () => {
		expect(normalizar(precio(249990))).toBe("$249.990");
	});

	it("muestra decimales solo si existen", () => {
		expect(normalizar(precio(1500.5))).toBe("$1.500,50");
	});

	it("un valor invalido es cero pesos", () => {
		expect(normalizar(precio("abc"))).toBe("$0");
		expect(normalizar(precio(undefined))).toBe("$0");
	});
});

describe("precioOGratis", () => {
	it("un precio 0 se muestra Gratis", () => {
		expect(precioOGratis(0)).toBe("Gratis");
		expect(precioOGratis("0")).toBe("Gratis");
	});

	it("otro precio se formatea", () => {
		expect(normalizar(precioOGratis(1000))).toBe("$1.000");
	});
});

describe("fecha", () => {
	it("pasa una fecha ISO a DD-MM-AAAA", () => {
		expect(fecha("2026-10-27")).toBe("27-10-2026");
	});

	it("sin fecha devuelve vacio", () => {
		expect(fecha("")).toBe("");
		expect(fecha(undefined)).toBe("");
	});
});

describe("fechaLocal", () => {
	it("escribe la fecha local con ceros a la izquierda", () => {
		expect(fechaLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
	});

	it("sin argumento usa la fecha de hoy", () => {
		expect(fechaLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("mesLegible", () => {
	it("escribe el mes en palabras", () => {
		expect(mesLegible("2026-09")).toBe("septiembre de 2026");
	});

	it("devuelve el texto tal cual si no es un mes valido", () => {
		expect(mesLegible("xx")).toBe("xx");
		expect(mesLegible("")).toBe("");
	});
});

describe("unidades", () => {
	it("usa el singular con una unidad y el plural en el resto", () => {
		expect(unidades(1)).toBe("1 unidad");
		expect(unidades(0)).toBe("0 unidades");
		expect(unidades(5)).toBe("5 unidades");
	});
});

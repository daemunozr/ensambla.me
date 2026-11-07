import { coincide, normalizarTexto } from "./busqueda.js";

describe("normalizarTexto", () => {
	it("pasa a minusculas, quita tildes y recorta espacios", () => {
		expect(normalizarTexto("Tarjeta GRÁFICA ")).toBe("tarjeta grafica");
	});

	it("trata null y undefined como texto vacio", () => {
		expect(normalizarTexto(null)).toBe("");
		expect(normalizarTexto(undefined)).toBe("");
	});

	it("convierte los numeros a texto", () => {
		expect(normalizarTexto(7600)).toBe("7600");
	});
});

describe("coincide", () => {
	it("una busqueda vacia coincide con todo", () => {
		expect(coincide("", "AMD Ryzen 5")).toBe(true);
		expect(coincide("   ", "AMD Ryzen 5")).toBe(true);
	});

	it("exige que aparezcan todas las palabras", () => {
		expect(coincide("ryzen 7600", "AMD Ryzen 5 7600")).toBe(true);
		expect(coincide("ryzen 9999", "AMD Ryzen 5 7600")).toBe(false);
	});

	it("ignora mayusculas y tildes", () => {
		expect(coincide("GRAFICA", "Tarjetas gráficas")).toBe(true);
	});

	it("busca en cualquiera de los campos", () => {
		expect(coincide("cpu amd", "CPU-R5-7600", "AMD Ryzen 5")).toBe(true);
	});
});

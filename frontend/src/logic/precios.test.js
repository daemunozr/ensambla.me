import { MAXIMO_DESCUENTO, enOferta, porcentajeDescuento, precioVigente } from "./precios.js";

describe("porcentajeDescuento", () => {
	it("devuelve el porcentaje entero de un descuento valido", () => {
		expect(porcentajeDescuento({ descuento: 15 })).toBe(15);
		expect(porcentajeDescuento({ descuento: "20" })).toBe(20);
	});

	it("trunca los decimales", () => {
		expect(porcentajeDescuento({ descuento: 12.9 })).toBe(12);
	});

	it("devuelve 0 si el descuento falta, esta vacio o es invalido", () => {
		expect(porcentajeDescuento({})).toBe(0);
		expect(porcentajeDescuento({ descuento: "" })).toBe(0);
		expect(porcentajeDescuento({ descuento: "abc" })).toBe(0);
		expect(porcentajeDescuento({ descuento: -5 })).toBe(0);
		expect(porcentajeDescuento(undefined)).toBe(0);
	});

	it("nunca supera el maximo", () => {
		expect(porcentajeDescuento({ descuento: 150 })).toBe(MAXIMO_DESCUENTO);
	});
});

describe("enOferta", () => {
	it("es verdadero solo con un descuento mayor que cero", () => {
		expect(enOferta({ descuento: 10 })).toBe(true);
		expect(enOferta({ descuento: 0 })).toBe(false);
		expect(enOferta({})).toBe(false);
	});
});

describe("precioVigente", () => {
	it("sin oferta es el precio de lista", () => {
		expect(precioVigente({ precio: 10000 })).toBe(10000);
	});

	it("aplica el descuento", () => {
		expect(precioVigente({ precio: 10000, descuento: 10 })).toBe(9000);
	});

	it("redondea a pesos enteros", () => {
		expect(precioVigente({ precio: 999, descuento: 10 })).toBe(899);
		expect(precioVigente({ precio: 995, descuento: 10 })).toBe(896);
	});

	it("un precio invalido vale 0", () => {
		expect(precioVigente({ precio: "x", descuento: 10 })).toBe(0);
		expect(precioVigente(undefined)).toBe(0);
	});
});

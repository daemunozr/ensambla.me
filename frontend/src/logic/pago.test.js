import { TARJETAS_DE_PRUEBA, agruparTarjeta, autorizarPago, formatearVencimiento, medioDePago, soloDigitos } from "./pago.js";

describe("soloDigitos", () => {
	it("deja unicamente los digitos", () => {
		expect(soloDigitos("4242-4242 abcd")).toBe("42424242");
		expect(soloDigitos(null)).toBe("");
	});
});

describe("agruparTarjeta", () => {
	it("escribe el numero en grupos de cuatro", () => {
		expect(agruparTarjeta("4242424242424242")).toBe("4242 4242 4242 4242");
	});

	it("no deja un espacio sobrante en un grupo incompleto", () => {
		expect(agruparTarjeta("424242")).toBe("4242 42");
		expect(agruparTarjeta("4242")).toBe("4242");
	});

	it("descarta las letras y limita a 19 digitos", () => {
		expect(agruparTarjeta("42a42")).toBe("4242");
		expect(agruparTarjeta("12345678901234567890")).toBe("1234 5678 9012 3456 789");
	});
});

describe("formatearVencimiento", () => {
	it("escribe el vencimiento como MM/AA", () => {
		expect(formatearVencimiento("0829")).toBe("08/29");
	});

	it("no agrega la barra hasta tener mas de dos digitos", () => {
		expect(formatearVencimiento("0")).toBe("0");
		expect(formatearVencimiento("08")).toBe("08");
		expect(formatearVencimiento("082")).toBe("08/2");
	});

	it("ignora lo que sobra", () => {
		expect(formatearVencimiento("08/2999")).toBe("08/29");
	});
});

describe("medioDePago", () => {
	it("recuerda solo los ultimos cuatro digitos", () => {
		const texto = medioDePago("4242 4242 4242 4242");
		expect(texto).toBe("Tarjeta terminada en 4242");
		expect(texto).not.toContain("4242 4242 4242");
	});
});

describe("autorizarPago", () => {
	it("aprueba la tarjeta de prueba de pago aprobado", () => {
		expect(autorizarPago({ numero: TARJETAS_DE_PRUEBA[0].numero, monto: 1000 })).toEqual({ aprobado: true });
	});

	it("rechaza la tarjeta que el emisor rechaza", () => {
		expect(autorizarPago({ numero: "4000 0000 0000 0002", monto: 1000 })).toEqual({
			aprobado: false,
			motivo: "La tarjeta fue rechazada por el banco emisor.",
		});
	});

	it("rechaza la tarjeta sin fondos suficientes", () => {
		expect(autorizarPago({ numero: "4000000000009995", monto: 1000 })).toEqual({
			aprobado: false,
			motivo: "La tarjeta no tiene fondos suficientes.",
		});
	});

	it("aprueba cualquier otro numero", () => {
		expect(autorizarPago({ numero: "5555 5555 5555 4444", monto: 500 }).aprobado).toBe(true);
	});

	it("rechaza un monto que no es positivo", () => {
		const esperado = { aprobado: false, motivo: "El monto a pagar no es valido." };
		expect(autorizarPago({ numero: "4242424242424242", monto: 0 })).toEqual(esperado);
		expect(autorizarPago({ numero: "4242424242424242", monto: "abc" })).toEqual(esperado);
	});
});

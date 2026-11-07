import { TASA_IVA, desgloseIva, masRecientesPrimero, puedeVerOrden, siguienteNumero, subtotalItems } from "./ordenes.js";

describe("subtotalItems", () => {
	it("suma cantidad por precio unitario de cada item", () => {
		const items = [
			{ cantidad: 2, precioUnitario: 1000 },
			{ cantidad: 1, precioUnitario: 500 },
		];
		expect(subtotalItems(items)).toBe(2500);
	});

	it("sin items es cero", () => {
		expect(subtotalItems([])).toBe(0);
	});
});

describe("desgloseIva", () => {
	it("separa el neto y el IVA contenidos en un total", () => {
		expect(desgloseIva(11900)).toEqual({ neto: 10000, iva: 1900 });
	});

	it("neto mas IVA es siempre el total", () => {
		[1000, 4990, 249990, 1].forEach((total) => {
			const { neto, iva } = desgloseIva(total);
			expect(neto + iva).toBe(total);
		});
	});

	it("la tasa de IVA es 19 %", () => {
		expect(TASA_IVA).toBe(0.19);
	});
});

describe("siguienteNumero", () => {
	it("la primera orden del ano es la 0001", () => {
		expect(siguienteNumero([], "2026-10-27")).toBe("ORD-2026-0001");
	});

	it("continua desde el mayor correlativo del mismo ano", () => {
		const ordenes = [{ numero: "ORD-2026-0003" }, { numero: "ORD-2026-0010" }, { numero: "ORD-2026-0002" }];
		expect(siguienteNumero(ordenes, "2026-10-27")).toBe("ORD-2026-0011");
	});

	it("ignora otros anos y numeros con otro formato", () => {
		const ordenes = [{ numero: "ORD-2025-0099" }, { numero: "XYZ" }, { numero: "ORD-2026-0004" }];
		expect(siguienteNumero(ordenes, "2026-01-02")).toBe("ORD-2026-0005");
		expect(siguienteNumero(ordenes, "2027-01-02")).toBe("ORD-2027-0001");
	});
});

describe("puedeVerOrden", () => {
	const orden = { numero: "ORD-2026-0001", cliente: "22222222K" };

	it("nadie ve una orden que no existe", () => {
		expect(puedeVerOrden(undefined, { rol: "ADMIN" })).toBe(false);
	});

	it("el personal ve todas las ordenes", () => {
		expect(puedeVerOrden(orden, { rol: "ADMIN", run: "1" })).toBe(true);
		expect(puedeVerOrden(orden, { rol: "LOGISTICA", run: "2" })).toBe(true);
	});

	it("un cliente ve solo las suyas", () => {
		expect(puedeVerOrden(orden, { rol: "CLIENTE", run: "22222222K" })).toBe(true);
		expect(puedeVerOrden(orden, { rol: "CLIENTE", run: "33333333K" })).toBe(false);
	});

	it("sin sesion no se ve la orden de un cliente", () => {
		expect(puedeVerOrden(orden, null)).toBe(false);
	});

	it("la orden de un invitado se ve con su enlace", () => {
		expect(puedeVerOrden({ numero: "ORD-2026-0002", cliente: "" }, null)).toBe(true);
	});
});

describe("masRecientesPrimero", () => {
	const ordenes = [
		{ numero: "ORD-2026-0002", fecha: "2026-09-01" },
		{ numero: "ORD-2026-0010", fecha: "2026-10-01" },
		{ numero: "ORD-2026-0003", fecha: "2026-10-01" },
	];

	it("ordena por fecha y a igualdad por numero, de mayor a menor", () => {
		expect(masRecientesPrimero(ordenes).map((o) => o.numero)).toEqual([
			"ORD-2026-0010",
			"ORD-2026-0003",
			"ORD-2026-0002",
		]);
	});

	it("devuelve una copia y no modifica la lista", () => {
		const copia = masRecientesPrimero(ordenes);
		expect(copia).not.toBe(ordenes);
		expect(ordenes[0].numero).toBe("ORD-2026-0002");
	});
});

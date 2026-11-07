import { OPCIONES_ENTREGA, consolidar, costoEnvio, entregaDe, faltantes } from "./checkout.js";

const catalogo = {
	A: { sku: "A", nombre: "Procesador", precio: 1000, stock: 5 },
	B: { sku: "B", nombre: "Placa", precio: 2000, stock: 1, descuento: 50 },
	C: { sku: "C", nombre: "Gabinete", precio: 3000, stock: 0 },
};
const buscar = (sku) => catalogo[sku];

describe("entregaDe", () => {
	it("encuentra una opcion por su codigo", () => {
		expect(entregaDe("RETIRO")).toBe(OPCIONES_ENTREGA[1]);
		expect(entregaDe("NO-EXISTE")).toBeUndefined();
	});
});

describe("costoEnvio", () => {
	it("el despacho a domicilio cuesta mientras no se llegue al monto gratis", () => {
		expect(costoEnvio("DOMICILIO", 100000)).toBe(4990);
		expect(costoEnvio("DOMICILIO", 199999)).toBe(4990);
	});

	it("el despacho a domicilio es gratis desde 200000", () => {
		expect(costoEnvio("DOMICILIO", 200000)).toBe(0);
		expect(costoEnvio("DOMICILIO", 350000)).toBe(0);
	});

	it("el retiro en tienda no cuesta nada", () => {
		expect(costoEnvio("RETIRO", 1000)).toBe(0);
	});

	it("una entrega desconocida no cuesta nada", () => {
		expect(costoEnvio("DRON", 1000)).toBe(0);
	});
});

describe("consolidar", () => {
	it("une en un item las lineas del mismo producto", () => {
		const items = consolidar(
			[
				{ producto: "A", cantidad: 2 },
				{ producto: "B", cantidad: 1 },
				{ producto: "A", cantidad: 3 },
			],
			buscar,
		);

		expect(items).toEqual([
			{ producto: "A", cantidad: 5, precioUnitario: 1000 },
			{ producto: "B", cantidad: 1, precioUnitario: 1000 },
		]);
	});

	it("usa el precio vigente, con la oferta aplicada", () => {
		const [item] = consolidar([{ producto: "B", cantidad: 1 }], buscar);
		expect(item.precioUnitario).toBe(1000);
	});

	it("una cantidad invalida cuenta como cero", () => {
		const [item] = consolidar([{ producto: "A", cantidad: "x" }], buscar);
		expect(item.cantidad).toBe(0);
	});
});

describe("faltantes", () => {
	it("esta vacio cuando todo alcanza", () => {
		expect(faltantes([{ producto: "A", cantidad: 5 }], buscar)).toEqual([]);
	});

	it("indica los productos que ya no estan en el catalogo", () => {
		expect(faltantes([{ producto: "Z", cantidad: 1 }], buscar)).toEqual(["Z (ya no esta en el catalogo)"]);
	});

	it("indica los productos sin stock", () => {
		expect(faltantes([{ producto: "C", cantidad: 1 }], buscar)).toEqual(["Gabinete (sin stock)"]);
	});

	it("indica cuantas unidades quedan cuando hay menos de las pedidas", () => {
		expect(faltantes([{ producto: "A", cantidad: 6 }], buscar)).toEqual(["Procesador (quedan 5)"]);
	});
});

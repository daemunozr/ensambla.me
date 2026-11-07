import { renderHook } from "@testing-library/react";
import { guardarCarrito, leerCarrito, useCarrito } from "./carrito.js";

describe("carrito en localStorage", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sin nada guardado el carrito parte vacio", () => {
		expect(leerCarrito()).toEqual([]);
	});

	it("guardarCarrito y leerCarrito van y vuelven", () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 2, armado: null }]);

		expect(leerCarrito()).toEqual([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 2, armado: null }]);
	});

	it("leerCarrito ajusta las cantidades al stock del catalogo", () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 9999, armado: null }]);

		expect(leerCarrito()[0].cantidad).toBeLessThan(9999);
	});

	it("con contenido corrupto el carrito parte vacio y se limpia la clave", () => {
		window.localStorage.setItem("carrito", "{no es json");

		expect(leerCarrito()).toEqual([]);
		expect(window.localStorage.getItem("carrito")).toBeNull();
		expect(console.error).toHaveBeenCalled();
	});

	it("con un JSON que no es un arreglo tambien parte vacio", () => {
		window.localStorage.setItem("carrito", JSON.stringify({ a: 1 }));
		expect(leerCarrito()).toEqual([]);
	});

	it("si localStorage no deja leer ni limpiar, igual devuelve un carrito vacio", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("bloqueado");
		});
		vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
			throw new Error("bloqueado");
		});

		expect(leerCarrito()).toEqual([]);
		expect(console.error).toHaveBeenCalledTimes(2);
	});

	it("si localStorage no deja escribir, guardarCarrito no interrumpe", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("cuota excedida");
		});

		expect(() => guardarCarrito([])).not.toThrow();
		expect(console.error).toHaveBeenCalledTimes(1);
	});
});

describe("useCarrito", () => {
	it("fuera de un CarritoProvider avisa del error de uso", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => renderHook(() => useCarrito())).toThrow("useCarrito debe usarse dentro de <CarritoProvider>");

		vi.restoreAllMocks();
	});
});

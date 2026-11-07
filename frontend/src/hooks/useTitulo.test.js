import { renderHook } from "@testing-library/react";
import { useTitulo } from "./useTitulo.js";

describe("useTitulo", () => {
	const tituloOriginal = document.title;

	afterEach(() => {
		document.title = tituloOriginal;
	});

	it("fija el titulo de la pestana al montarse", () => {
		renderHook(() => useTitulo("Carrito"));

		expect(document.title).toBe("Carrito");
	});

	it("cambia el titulo cuando recibe otro", () => {
		const { rerender } = renderHook(({ titulo }) => useTitulo(titulo), {
			initialProps: { titulo: "Productos" },
		});

		rerender({ titulo: "Ofertas" });

		expect(document.title).toBe("Ofertas");
	});
});

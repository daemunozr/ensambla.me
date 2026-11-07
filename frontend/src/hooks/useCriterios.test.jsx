import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useCriterios } from "./useCriterios.js";

const envolver = (ruta) =>
	function Envoltorio({ children }) {
		return <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>;
	};

describe("useCriterios", () => {
	it("lee los criterios de la URL", () => {
		const { result } = renderHook(() => useCriterios(), { wrapper: envolver("/productos?q=ram&min=1000&oferta=1") });

		expect(result.current.criterios).toMatchObject({ q: "ram", min: 1000, oferta: true, stock: false });
	});

	it("sin parametros usa el orden inicial", () => {
		const { result } = renderHook(() => useCriterios("nombre"), { wrapper: envolver("/productos") });

		expect(result.current.criterios.orden).toBe("nombre");
	});

	it("aplicar reemplaza todos los criterios", () => {
		const { result } = renderHook(() => useCriterios(), { wrapper: envolver("/productos?q=ram") });

		act(() => result.current.aplicar({ categoria: "cpu", stock: true }));

		expect(result.current.criterios).toMatchObject({ q: "", categoria: "cpu", stock: true });
	});
});

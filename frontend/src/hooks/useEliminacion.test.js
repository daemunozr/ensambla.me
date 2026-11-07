import { act, renderHook } from "@testing-library/react";
import { useEliminacion } from "./useEliminacion.js";

describe("useEliminacion", () => {
	it("parte sin registro pendiente ni aviso", () => {
		const { result } = renderHook(() => useEliminacion(vi.fn()));

		expect(result.current.pendiente).toBeNull();
		expect(result.current.aviso).toBeNull();
	});

	it("pedir deja el registro pendiente de confirmacion", () => {
		const { result } = renderHook(() => useEliminacion(vi.fn()));

		act(() => result.current.pedir({ sku: "A" }));

		expect(result.current.pendiente).toEqual({ sku: "A" });
	});

	it("cancelar descarta el registro sin eliminar nada", () => {
		const eliminar = vi.fn();
		const { result } = renderHook(() => useEliminacion(eliminar));

		act(() => result.current.pedir({ sku: "A" }));
		act(() => result.current.cancelar());

		expect(result.current.pendiente).toBeNull();
		expect(eliminar).not.toHaveBeenCalled();
	});

	it("confirmar elimina el registro pendiente y avisa del exito", async () => {
		const eliminar = vi.fn().mockResolvedValue({ ok: true, mensaje: "Se elimino." });
		const { result } = renderHook(() => useEliminacion(eliminar));

		act(() => result.current.pedir({ sku: "A" }));
		await act(async () => result.current.confirmar());

		expect(eliminar).toHaveBeenCalledWith({ sku: "A" });
		expect(result.current.aviso).toEqual({ tipo: "success", contenido: "Se elimino." });
		expect(result.current.pendiente).toBeNull();
	});

	it("confirmar avisa del rechazo cuando no se pudo eliminar", async () => {
		const eliminar = vi.fn().mockResolvedValue({ ok: false, mensaje: "Tiene ordenes." });
		const { result } = renderHook(() => useEliminacion(eliminar));

		act(() => result.current.pedir({ run: "1" }));
		await act(async () => result.current.confirmar());

		expect(result.current.aviso).toEqual({ tipo: "danger", contenido: "Tiene ordenes." });
	});
});

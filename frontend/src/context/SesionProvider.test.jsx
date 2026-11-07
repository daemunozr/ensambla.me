import { act, renderHook } from "@testing-library/react";
import { useSesion } from "./sesion.js";
import SesionProvider from "./SesionProvider.jsx";

const envolver = ({ children }) => <SesionProvider>{children}</SesionProvider>;

describe("SesionProvider", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("parte sin sesion", () => {
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });

		expect(result.current.sesion).toBeNull();
	});

	it("recupera la sesion guardada al montarse", () => {
		window.sessionStorage.setItem("sesion", JSON.stringify({ run: "123456785", rol: "CLIENTE", nombre: "Camila" }));

		const { result } = renderHook(() => useSesion(), { wrapper: envolver });

		expect(result.current.sesion).toMatchObject({ run: "123456785", nombre: "Camila" });
	});

	describe("iniciar", () => {
		it("con credenciales correctas guarda la sesion sin la contrasena", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			act(() => {
				respuesta = result.current.iniciar("camila@gmail.com", "cliente123");
			});

			expect(respuesta.ok).toBe(true);
			expect(result.current.sesion).toEqual({
				run: "123456785",
				nombre: "Camila",
				apellidos: "Soto Vera",
				correo: "camila@gmail.com",
				rol: "CLIENTE",
			});
			expect(window.sessionStorage.getItem("sesion")).not.toContain("cliente123");
		});

		it("no distingue mayusculas ni espacios en el correo", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			act(() => {
				result.current.iniciar("  CAMILA@Gmail.com ", "cliente123");
			});

			expect(result.current.sesion.run).toBe("123456785");
		});

		it("con una contrasena incorrecta devuelve un mensaje generico y no inicia sesion", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			act(() => {
				respuesta = result.current.iniciar("camila@gmail.com", "otra");
			});

			expect(respuesta).toEqual({ ok: false, mensaje: "Correo o contrasena incorrectos." });
			expect(result.current.sesion).toBeNull();
		});

		it("con un correo que no existe devuelve el mismo mensaje", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			act(() => {
				respuesta = result.current.iniciar("nadie@gmail.com", "cliente123");
			});

			expect(respuesta.mensaje).toBe("Correo o contrasena incorrectos.");
		});

		it("si no se puede guardar en sessionStorage igual inicia la sesion", () => {
			const error = vi.spyOn(console, "error").mockImplementation(() => {});
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw new Error("bloqueado");
			});
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			act(() => {
				result.current.iniciar("camila@gmail.com", "cliente123");
			});

			expect(result.current.sesion).not.toBeNull();
			expect(error).toHaveBeenCalledTimes(1);
		});
	});

	it("cerrar borra la sesion", () => {
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });
		act(() => {
			result.current.iniciar("camila@gmail.com", "cliente123");
		});

		act(() => result.current.cerrar());

		expect(result.current.sesion).toBeNull();
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
	});

	it("cerrar no toca el carrito", () => {
		window.localStorage.setItem("carrito", "[]");
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });
		act(() => {
			result.current.iniciar("camila@gmail.com", "cliente123");
		});

		act(() => result.current.cerrar());

		expect(window.localStorage.getItem("carrito")).toBe("[]");
		window.localStorage.clear();
	});

	describe("actualizar", () => {
		it("refleja el nombre, los apellidos y el correo, pero no el RUN ni el rol", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });
			act(() => {
				result.current.iniciar("camila@gmail.com", "cliente123");
			});

			act(() =>
				result.current.actualizar({ nombre: "Cami", apellidos: "Soto", correo: "cami@gmail.com", run: "999", rol: "ADMIN" }),
			);

			expect(result.current.sesion).toMatchObject({ nombre: "Cami", apellidos: "Soto", correo: "cami@gmail.com", run: "123456785", rol: "CLIENTE" });
			expect(JSON.parse(window.sessionStorage.getItem("sesion")).nombre).toBe("Cami");
		});

		it("sin sesion no hace nada", () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			act(() => result.current.actualizar({ nombre: "X", apellidos: "Y", correo: "x@gmail.com" }));

			expect(result.current.sesion).toBeNull();
		});
	});

	it("useSesion fuera del proveedor avisa del error de uso", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => renderHook(() => useSesion())).toThrow("useSesion debe usarse dentro de <SesionProvider>");
	});
});

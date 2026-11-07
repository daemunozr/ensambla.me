import { act, renderHook, waitFor } from "@testing-library/react";
import { llamadas, vencerAccesos } from "../testing/apiFalsa.js";
import { peticion } from "../services/api.js";
import { EVENTO_SESION_EXPIRADA, useSesion } from "./sesion.js";
import SesionProvider from "./SesionProvider.jsx";

const envolver = ({ children }) => <SesionProvider>{children}</SesionProvider>;
const GUARDADA = {
	run: "123456785",
	rol: "CLIENTE",
	nombre: "Camila",
	accessToken: "CLIENTE:123456785",
	refreshToken: "REFRESH|CLIENTE:123456785",
};

async function iniciarCamila(result) {
	let respuesta;
	await act(async () => {
		respuesta = await result.current.iniciar("camila@gmail.com", "cliente123");
	});
	return respuesta;
}

describe("SesionProvider", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("parte sin sesion", () => {
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });

		expect(result.current.sesion).toBeNull();
	});

	it("recupera la sesion guardada al montarse (recargar la pagina la mantiene)", () => {
		window.sessionStorage.setItem("sesion", JSON.stringify(GUARDADA));

		const { result } = renderHook(() => useSesion(), { wrapper: envolver });

		expect(result.current.sesion).toMatchObject({ run: "123456785", nombre: "Camila" });
	});

	describe("iniciar", () => {
		it("con credenciales correctas guarda los tokens y la cuenta, sin la contrasena", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			const respuesta = await iniciarCamila(result);

			expect(respuesta.ok).toBe(true);
			expect(result.current.sesion).toEqual({
				accessToken: "CLIENTE:123456785",
				refreshToken: "REFRESH|CLIENTE:123456785",
				run: "123456785",
				nombre: "Camila",
				apellidos: "Soto Vera",
				correo: "camila@gmail.com",
				rol: "CLIENTE",
			});
			expect(JSON.parse(window.sessionStorage.getItem("sesion")).accessToken).toBe("CLIENTE:123456785");
			expect(window.sessionStorage.getItem("sesion")).not.toContain("cliente123");
		});

		it("completa apellidos y correo con GET /usuarios/me usando el token recien recibido", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			await iniciarCamila(result);

			expect(llamadas.map((l) => `${l.metodo} ${l.ruta}`)).toEqual(["POST /auth/login", "GET /usuarios/me"]);
			expect(llamadas[0].autorizacion).toBeNull();
			expect(llamadas[1].autorizacion).toBe("Bearer CLIENTE:123456785");
		});

		it("si no se puede pedir la cuenta completa, inicia sesion con lo que trae el login", async () => {
			const api = globalThis.fetch;
			vi.stubGlobal("fetch", (url, opciones) =>
				String(url).endsWith("/usuarios/me") ? Promise.resolve(new Response(null, { status: 500 })) : api(url, opciones),
			);
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			const respuesta = await iniciarCamila(result);

			expect(respuesta.ok).toBe(true);
			expect(result.current.sesion).toMatchObject({ run: "123456785", nombre: "Camila", apellidos: "", correo: "camila@gmail.com", rol: "CLIENTE" });
		});

		it("no distingue mayusculas ni espacios en el correo", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			await act(async () => {
				await result.current.iniciar("  CAMILA@Gmail.com ", "cliente123");
			});

			expect(result.current.sesion.run).toBe("123456785");
		});

		it("con una contrasena incorrecta devuelve un mensaje generico y no inicia sesion", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			await act(async () => {
				respuesta = await result.current.iniciar("camila@gmail.com", "otra");
			});

			expect(respuesta).toEqual({ ok: false, mensaje: "Correo o contrasena incorrectos." });
			expect(result.current.sesion).toBeNull();
			expect(window.sessionStorage.getItem("sesion")).toBeNull();
		});

		it("con un correo que no existe devuelve el mismo mensaje", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			await act(async () => {
				respuesta = await result.current.iniciar("nadie@gmail.com", "cliente123");
			});

			expect(respuesta.mensaje).toBe("Correo o contrasena incorrectos.");
		});

		it("si la API no responde lo dice y no inicia sesion", async () => {
			vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });

			let respuesta;
			await act(async () => {
				respuesta = await result.current.iniciar("camila@gmail.com", "cliente123");
			});

			expect(respuesta.ok).toBe(false);
			expect(respuesta.mensaje).toMatch(/No se pudo conectar/);
			expect(result.current.sesion).toBeNull();
		});
	});

	it("cerrar borra la sesion y los tokens", async () => {
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });
		await iniciarCamila(result);

		act(() => result.current.cerrar());

		expect(result.current.sesion).toBeNull();
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
	});

	it("cerrar no toca el carrito", async () => {
		window.localStorage.setItem("carrito", "[]");
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });
		await iniciarCamila(result);

		act(() => result.current.cerrar());

		expect(window.localStorage.getItem("carrito")).toBe("[]");
	});

	it("termina la sesion cuando la API rechaza los tokens y no se pueden renovar", async () => {
		window.sessionStorage.setItem("sesion", JSON.stringify({ ...GUARDADA, refreshToken: "invalido" }));
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });
		vencerAccesos();

		await act(async () => {
			await peticion("GET", "/boletas");
		});

		await waitFor(() => expect(result.current.sesion).toBeNull());
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
	});

	it("escucha el aviso de sesion expirada que emite el cliente HTTP", () => {
		window.sessionStorage.setItem("sesion", JSON.stringify(GUARDADA));
		const { result } = renderHook(() => useSesion(), { wrapper: envolver });

		act(() => {
			window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
		});

		expect(result.current.sesion).toBeNull();
	});

	describe("actualizarPerfil", () => {
		const CUENTA = {
			run: "123456785",
			nombre: "Camila",
			apellidos: "Soto Vera",
			correo: "camila@gmail.com",
			comuna: "RM-04",
			direccion: "Irarrazaval 2550, Nunoa",
		};

		it("guarda los datos en la API y refleja nombre, apellidos y correo en la sesion, pero no el RUN ni el rol", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });
			await iniciarCamila(result);

			let respuesta;
			await act(async () => {
				respuesta = await result.current.actualizarPerfil(CUENTA, { nombre: "Cami", apellidos: "Soto", correo: "cami@gmail.com" });
			});

			expect(respuesta.ok).toBe(true);
			expect(result.current.sesion).toMatchObject({ nombre: "Cami", apellidos: "Soto", correo: "cami@gmail.com", run: "123456785", rol: "CLIENTE" });
			expect(JSON.parse(window.sessionStorage.getItem("sesion")).nombre).toBe("Cami");
			expect(llamadas.at(-1)).toMatchObject({ metodo: "PUT", ruta: "/usuarios/me" });
		});

		it("el cuerpo lleva la region deducida de la comuna y no lleva RUN ni rol", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });
			await iniciarCamila(result);

			await act(async () => {
				await result.current.actualizarPerfil(CUENTA, { nombre: "Cami" });
			});

			const cuerpo = llamadas.at(-1).cuerpo;
			expect(cuerpo).toMatchObject({ nombre: "Cami", comuna: "RM-04", region: "RM", contrasenaActual: null, contrasenaNueva: null });
			expect(cuerpo).not.toHaveProperty("run");
			expect(cuerpo).not.toHaveProperty("tipoUsuario");
		});

		it("devuelve el mensaje del servidor si lo rechaza y no cambia la sesion", async () => {
			const { result } = renderHook(() => useSesion(), { wrapper: envolver });
			await iniciarCamila(result);

			let respuesta;
			await act(async () => {
				respuesta = await result.current.actualizarPerfil(CUENTA, { correo: "admin@duoc.cl" });
			});

			expect(respuesta.ok).toBe(false);
			expect(respuesta.mensaje).toMatch(/correo/);
			expect(result.current.sesion.correo).toBe("camila@gmail.com");
		});
	});

	it("useSesion fuera del proveedor avisa del error de uso", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => renderHook(() => useSesion())).toThrow("useSesion debe usarse dentro de <SesionProvider>");
	});
});

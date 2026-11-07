import { EVENTO_SESION_EXPIRADA } from "../context/sesion.js";
import { URL_API, crear, eliminar, obtener, peticion, reemplazar } from "./api.js";

const SESION = {
	accessToken: "acceso-1",
	refreshToken: "renovacion-1",
	run: "123456785",
	rol: "CLIENTE",
	nombre: "Camila",
};
const iniciarSesion = (sesion = SESION) => window.sessionStorage.setItem("sesion", JSON.stringify(sesion));
const sesionGuardada = () => JSON.parse(window.sessionStorage.getItem("sesion"));

const json = (estado, cuerpo) =>
	new Response(estado === 204 ? null : JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json" } });

/** Respuestas en orden: cada llamada a fetch toma la siguiente. */
function responder(...respuestas) {
	const cola = [...respuestas];
	const mock = vi.fn(async () => {
		const siguiente = cola.shift();
		if (siguiente instanceof Error) throw siguiente;
		return siguiente;
	});
	vi.stubGlobal("fetch", mock);
	return mock;
}

const cabecera = (llamada, nombre) => llamada[1].headers[nombre];

describe("cliente HTTP", () => {
	describe("la peticion", () => {
		it("usa la URL base de la API y el metodo pedido", async () => {
			const fetchMock = responder(json(200, []));

			await obtener("/productos");

			expect(fetchMock.mock.calls[0][0]).toBe(`${URL_API}/productos`);
			expect(fetchMock.mock.calls[0][1].method).toBe("GET");
			expect(URL_API).toMatch(/\/api\/v1$/);
		});

		it("envia el cuerpo como JSON con su Content-Type", async () => {
			const fetchMock = responder(json(201, { ok: 1 }));

			await crear("/categorias", { codigo: "gpu" });

			const [, opciones] = fetchMock.mock.calls[0];
			expect(opciones.method).toBe("POST");
			expect(opciones.headers["Content-Type"]).toBe("application/json");
			expect(JSON.parse(opciones.body)).toEqual({ codigo: "gpu" });
		});

		it("una lectura no manda cuerpo ni Content-Type", async () => {
			const fetchMock = responder(json(200, []));

			await obtener("/productos");

			expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
			expect(cabecera(fetchMock.mock.calls[0], "Content-Type")).toBeUndefined();
		});

		it("PUT y DELETE usan sus metodos", async () => {
			const fetchMock = responder(json(200, {}), json(204));

			await reemplazar("/productos/X", { a: 1 });
			await eliminar("/productos/X");

			expect(fetchMock.mock.calls.map((c) => c[1].method)).toEqual(["PUT", "DELETE"]);
		});

		it("sin sesion no manda Authorization", async () => {
			const fetchMock = responder(json(200, []));

			await obtener("/productos");

			expect(cabecera(fetchMock.mock.calls[0], "Authorization")).toBeUndefined();
		});

		it("con sesion manda el token de acceso como Bearer", async () => {
			iniciarSesion();
			const fetchMock = responder(json(200, []));

			await obtener("/boletas");

			expect(cabecera(fetchMock.mock.calls[0], "Authorization")).toBe("Bearer acceso-1");
		});
	});

	describe("el resultado", () => {
		it("una respuesta correcta trae el estado y los datos", async () => {
			responder(json(201, { sku: "A" }));

			expect(await crear("/productos", {})).toEqual({ ok: true, estado: 201, datos: { sku: "A" } });
		});

		it("un 204 no trae datos", async () => {
			responder(json(204));

			expect(await eliminar("/productos/A")).toEqual({ ok: true, estado: 204, datos: null });
		});

		it("un error trae el mensaje del servidor", async () => {
			responder(json(409, { estado: 409, mensaje: "Ya existe el producto A.", errores: null }));

			expect(await crear("/productos", {})).toEqual({ ok: false, estado: 409, mensaje: "Ya existe el producto A.", errores: null });
		});

		it("un 400 de validacion junta el mensaje de cada campo", async () => {
			responder(json(400, { estado: 400, mensaje: "Datos invalidos.", errores: { precio: "El precio no puede ser negativo.", stock: "El stock es obligatorio." } }));

			const resultado = await crear("/productos", {});

			expect(resultado.mensaje).toBe("El precio no puede ser negativo. El stock es obligatorio.");
			expect(resultado.errores).toEqual({ precio: "El precio no puede ser negativo.", stock: "El stock es obligatorio." });
		});

		it("sin conexion explica que no se pudo llegar a la API", async () => {
			responder(new TypeError("Failed to fetch"));

			const resultado = await obtener("/productos");

			expect(resultado).toMatchObject({ ok: false, estado: 0 });
			expect(resultado.mensaje).toMatch(/No se pudo conectar con el servidor/);
		});

		it("un 500 sin cuerpo da un mensaje generico", async () => {
			responder(new Response("<html>", { status: 500 }));

			expect((await obtener("/productos")).mensaje).toMatch(/problema/);
		});

		it("un 403 dice que el rol no tiene permiso", async () => {
			iniciarSesion();
			responder(new Response(null, { status: 403 }));

			expect((await obtener("/usuarios")).mensaje).toMatch(/rol no tiene permiso/);
		});
	});

	describe("renovacion del token (401)", () => {
		const renovado = () => json(200, { accessToken: "acceso-2", refreshToken: "renovacion-2", rol: "CLIENTE" });

		it("renueva el token y repite la llamada con el nuevo", async () => {
			iniciarSesion();
			const fetchMock = responder(json(401, { mensaje: "vencido" }), renovado(), json(200, [{ numero: "ORD-1" }]));

			const resultado = await obtener("/boletas");

			expect(resultado).toEqual({ ok: true, estado: 200, datos: [{ numero: "ORD-1" }] });
			expect(fetchMock.mock.calls.map((c) => c[0].replace(URL_API, ""))).toEqual(["/boletas", "/auth/refresh", "/boletas"]);
			expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: "renovacion-1" });
			expect(cabecera(fetchMock.mock.calls[2], "Authorization")).toBe("Bearer acceso-2");
		});

		it("guarda los tokens nuevos en la sesion sin perder el resto de sus datos", async () => {
			iniciarSesion();
			responder(json(401, {}), renovado(), json(200, []));

			await obtener("/boletas");

			expect(sesionGuardada()).toMatchObject({ accessToken: "acceso-2", refreshToken: "renovacion-2", run: "123456785", nombre: "Camila" });
		});

		it("si no se puede renovar termina la sesion y avisa", async () => {
			iniciarSesion();
			const alExpirar = vi.fn();
			window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
			responder(json(401, {}), json(401, { mensaje: "el token es invalido" }), json(401, { mensaje: "Falta la sesion." }));

			const resultado = await obtener("/boletas");
			window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

			expect(resultado).toMatchObject({ ok: false, estado: 401 });
			expect(window.sessionStorage.getItem("sesion")).toBeNull();
			expect(alExpirar).toHaveBeenCalledTimes(1);
		});

		it("si la llamada repetida vuelve a dar 401 tambien termina la sesion", async () => {
			iniciarSesion();
			responder(json(401, {}), renovado(), json(401, {}), json(401, {}));

			await obtener("/boletas");

			expect(window.sessionStorage.getItem("sesion")).toBeNull();
		});

		it("varias llamadas que fallan a la vez comparten una sola renovacion", async () => {
			iniciarSesion();
			let renovaciones = 0;
			vi.stubGlobal("fetch", async (url, opciones) => {
				if (url.endsWith("/auth/refresh")) {
					renovaciones += 1;
					return renovado();
				}
				return opciones.headers.Authorization === "Bearer acceso-1" ? json(401, {}) : json(200, []);
			});

			const resultados = await Promise.all([obtener("/boletas"), obtener("/usuarios"), obtener("/usuarios/me")]);

			expect(renovaciones).toBe(1);
			expect(resultados.every((r) => r.ok)).toBe(true);
		});

		it("sin conexion durante la renovacion tambien termina la sesion", async () => {
			iniciarSesion();
			responder(json(401, {}), new TypeError("Failed to fetch"), json(401, {}));

			await obtener("/boletas");

			expect(window.sessionStorage.getItem("sesion")).toBeNull();
		});

		it("al terminar la sesion, un GET se repite sin token: el catalogo publico carga igual", async () => {
			iniciarSesion();
			const fetchMock = responder(json(401, {}), json(401, {}), json(200, [{ sku: "CPU-R5-7600" }]));

			const resultado = await obtener("/productos");

			expect(resultado).toEqual({ ok: true, estado: 200, datos: [{ sku: "CPU-R5-7600" }] });
			expect(fetchMock).toHaveBeenCalledTimes(3);
			expect(cabecera(fetchMock.mock.calls[2], "Authorization")).toBeUndefined();
			expect(window.sessionStorage.getItem("sesion")).toBeNull();
		});

		it("al terminar la sesion, un POST no se repite: la compra no pasa a ser de invitado", async () => {
			iniciarSesion();
			const fetchMock = responder(json(401, {}), json(401, {}));

			const resultado = await crear("/boletas", { lineas: [] });

			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(resultado).toMatchObject({ ok: false, estado: 401 });
		});

		it("un 401 sin sesion no intenta renovar", async () => {
			const fetchMock = responder(json(401, { mensaje: "Falta la sesion." }));

			const resultado = await obtener("/boletas");

			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(resultado.estado).toBe(401);
		});

		it("un 401 del login (credenciales incorrectas) no renueva ni cierra la sesion", async () => {
			iniciarSesion();
			const fetchMock = responder(json(401, { mensaje: "Credenciales invalidas." }));

			const resultado = await peticion("POST", "/auth/login", { correo: "a", contrasena: "b" });

			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(resultado.mensaje).toBe("Credenciales invalidas.");
			expect(window.sessionStorage.getItem("sesion")).not.toBeNull();
		});

		it("un 403 no cierra la sesion: el rol no alcanza pero la sesion es valida", async () => {
			iniciarSesion();
			const fetchMock = responder(json(403, { mensaje: "Sin permiso." }));

			const resultado = await obtener("/usuarios");

			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(resultado.estado).toBe(403);
			expect(window.sessionStorage.getItem("sesion")).not.toBeNull();
		});
	});
});

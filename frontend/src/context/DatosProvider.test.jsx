import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vaciarTodo } from "../data/datos.js";
import { baseDeDatos, llamadas } from "../testing/apiFalsa.js";
import { SESION_ADMIN, SESION_CLIENTE, SESION_LOGISTICA, renderConProviders, sesionDe } from "../testUtils.jsx";
import { usuarios as usuariosSemilla } from "../data/semillas.js";
import DatosProvider from "./DatosProvider.jsx";
import SesionProvider from "./SesionProvider.jsx";
import { useDatos } from "./datos.js";
import { useSesion } from "./sesion.js";

const productoNuevo = {
	sku: "TST-001",
	nombre: "Producto de prueba",
	descripcion: "",
	precio: 1000,
	stock: 5,
	categoria: "cpu",
};

/**
 * Componente de prueba: muestra cuantos productos hay y tiene un boton que
 * crea un producto. El resultado de crearProducto se entrega a "alResultado".
 */
function PruebaDatos({ sku = productoNuevo.sku, alResultado }) {
	const { productos, crearProducto } = useDatos();

	return (
		<div>
			<p data-testid="total">{productos.length}</p>
			<button onClick={async () => alResultado(await crearProducto({ ...productoNuevo, sku }))}>crear producto</button>
		</div>
	);
}

describe("DatosProvider (con los datos ya cargados)", () => {
	it("entrega los productos de la semilla", () => {
		renderConProviders(<PruebaDatos alResultado={vi.fn()} />);

		expect(Number(screen.getByTestId("total").textContent)).toBeGreaterThan(0);
	});

	it("crear un producto valido llama a la API y actualiza la lista sin recargar la pagina", async () => {
		const alResultado = vi.fn();
		renderConProviders(<PruebaDatos alResultado={alResultado} />, { sesion: SESION_ADMIN });
		const antes = Number(screen.getByTestId("total").textContent);

		await userEvent.click(screen.getByRole("button", { name: "crear producto" }));

		await waitFor(() => expect(Number(screen.getByTestId("total").textContent)).toBe(antes + 1));
		expect(alResultado).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
		expect(baseDeDatos().productos.some((p) => p.sku === "TST-001")).toBe(true);
	});

	it("crear un producto con un SKU repetido no cambia la lista y devuelve el error del servidor", async () => {
		const alResultado = vi.fn();
		// CPU-R5-7600 ya existe en la semilla.
		renderConProviders(<PruebaDatos sku="CPU-R5-7600" alResultado={alResultado} />, { sesion: SESION_ADMIN });
		const antes = Number(screen.getByTestId("total").textContent);

		await userEvent.click(screen.getByRole("button", { name: "crear producto" }));

		await waitFor(() => expect(alResultado).toHaveBeenCalledWith(expect.objectContaining({ ok: false })));
		expect(alResultado.mock.calls[0][0].mensaje).toMatch(/Ya existe/);
		expect(Number(screen.getByTestId("total").textContent)).toBe(antes);
	});

	it("un rol sin permiso recibe el rechazo del servidor", async () => {
		const alResultado = vi.fn();
		renderConProviders(<PruebaDatos alResultado={alResultado} />, { sesion: SESION_CLIENTE });

		await userEvent.click(screen.getByRole("button", { name: "crear producto" }));

		await waitFor(() => expect(alResultado).toHaveBeenCalledWith({ ok: false, mensaje: expect.stringMatching(/permiso/) }));
	});
});

/** Monta los proveedores reales, sin datos precargados, para probar la carga desde la API. */
function montarSinPrecarga({ sesion = null, estricto = false, boleta = null } = {}) {
	vaciarTodo();
	if (boleta) window.sessionStorage.setItem("ultimaBoleta", JSON.stringify(boleta));
	if (sesion) window.sessionStorage.setItem("sesion", JSON.stringify(sesion));
	const lectura = {};
	function Lector() {
		const datos = useDatos();
		const sesionActual = useSesion();
		// La prueba lee siempre lo ultimo que entrego el proveedor.
		useEffect(() => {
			lectura.datos = datos;
			lectura.sesion = sesionActual;
		});
		return <p data-testid="listo">{datos.productos.length}</p>;
	}
	const arbol = (
		<MemoryRouter>
			<SesionProvider>
				<DatosProvider>
					<Lector />
				</DatosProvider>
			</SesionProvider>
		</MemoryRouter>
	);
	render(estricto ? <StrictMode>{arbol}</StrictMode> : arbol);
	return lectura;
}

describe("DatosProvider (carga desde la API)", () => {
	it("muestra «Cargando» hasta que llega el catalogo y luego lo entrega", async () => {
		montarSinPrecarga();

		expect(screen.getByRole("status")).toHaveTextContent("Cargando");
		expect(await screen.findByTestId("listo")).not.toHaveTextContent(/^0$/);
		expect(llamadas.map((l) => `${l.metodo} ${l.ruta}`)).toEqual(expect.arrayContaining(["GET /productos", "GET /categorias"]));
	});

	it("sin sesion no pide boletas ni usuarios", async () => {
		montarSinPrecarga();
		await screen.findByTestId("listo");

		expect(llamadas.some((l) => l.ruta === "/boletas" || l.ruta === "/usuarios")).toBe(false);
	});

	it("un administrador recibe usuarios y todas las boletas", async () => {
		const lectura = montarSinPrecarga({ sesion: SESION_ADMIN });
		await screen.findByTestId("listo");

		expect(lectura.datos.usuarios.length).toBeGreaterThan(0);
		expect(lectura.datos.ordenes.length).toBeGreaterThan(1);
		expect(lectura.datos.itemsOrden.length).toBeGreaterThan(0);
	});

	it("el personal de logistica recibe las boletas pero no pide los usuarios", async () => {
		const lectura = montarSinPrecarga({ sesion: SESION_LOGISTICA });
		await screen.findByTestId("listo");

		expect(lectura.datos.ordenes.length).toBeGreaterThan(1);
		expect(lectura.datos.usuarios).toEqual([]);
		expect(llamadas.some((l) => l.ruta === "/usuarios")).toBe(false);
	});

	it("un cliente recibe solo sus boletas, con la forma que usa la interfaz", async () => {
		const camila = usuariosSemilla.find((u) => u.correo === "camila@gmail.com");
		const lectura = montarSinPrecarga({ sesion: sesionDe(camila) });
		await screen.findByTestId("listo");

		const { ordenes, itemsOrden } = lectura.datos;
		expect(ordenes.length).toBeGreaterThan(0);
		expect(ordenes.every((o) => o.cliente === camila.run)).toBe(true);
		expect(itemsOrden.every((i) => ordenes.some((o) => o.numero === i.orden))).toBe(true);
		expect(itemsOrden[0]).toEqual({
			orden: expect.any(String),
			producto: expect.any(String),
			cantidad: expect.any(Number),
			precioUnitario: expect.any(Number),
		});
	});

	it("al cerrar sesion deja de tener boletas y usuarios", async () => {
		const lectura = montarSinPrecarga({ sesion: SESION_ADMIN });
		await screen.findByTestId("listo");

		act(() => lectura.sesion.cerrar());

		await waitFor(() => expect(lectura.datos.ordenes).toEqual([]));
		expect(lectura.datos.usuarios).toEqual([]);
		expect(lectura.datos.productos.length).toBeGreaterThan(0);
	});

	it("al iniciar sesion carga las boletas de la cuenta", async () => {
		const lectura = montarSinPrecarga();
		await screen.findByTestId("listo");
		expect(lectura.datos.ordenes).toEqual([]);

		await act(async () => {
			await lectura.sesion.iniciar("camila@gmail.com", "cliente123");
		});

		await waitFor(() => expect(lectura.datos.ordenes.length).toBeGreaterThan(0));
	});

	it("recargar la pagina no borra la boleta que acaba de comprar un invitado (tampoco en StrictMode)", async () => {
		montarSinPrecarga({ estricto: true, boleta: { orden: { numero: "ORD-2026-0009" }, items: [] } });
		await screen.findByTestId("listo");

		expect(window.sessionStorage.getItem("ultimaBoleta")).toContain("ORD-2026-0009");
	});

	it("cerrar sesion si borra la boleta guardada", async () => {
		const lectura = montarSinPrecarga({ sesion: SESION_ADMIN });
		await screen.findByTestId("listo");
		window.sessionStorage.setItem("ultimaBoleta", JSON.stringify({ orden: { numero: "ORD-2026-0009" }, items: [] }));

		act(() => lectura.sesion.cerrar());

		await waitFor(() => expect(window.sessionStorage.getItem("ultimaBoleta")).toBeNull());
	});

	it("si la API no responde avisa y permite reintentar", async () => {
		const sinRed = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
		vi.stubGlobal("fetch", sinRed);
		montarSinPrecarga();

		expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor");
		expect(screen.queryByTestId("listo")).not.toBeInTheDocument();

		// Vuelve la API: el boton lo intenta de nuevo.
		const { instalarApiFalsa } = await import("../testing/apiFalsa.js");
		instalarApiFalsa();
		await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

		expect(await screen.findByTestId("listo")).toBeInTheDocument();
	});
});

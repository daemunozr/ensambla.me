import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { guardarCarrito } from "../context/carrito.js";
import { orden, ordenes, producto } from "../data/datos.js";
import { SESION_CLIENTE, limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import Checkout from "./Checkout.jsx";
import { baseDeDatos, llamadas } from "../testing/apiFalsa.js";

// Camila existe en los datos de prueba, asi que sus datos de envio se completan solos.
const CAMILA = sesionDe({ run: "123456785", nombre: "Camila", apellidos: "Soto Vera", correo: "camila@gmail.com", tipoUsuario: "CLIENTE" });

function Destino() {
	const { pathname, state } = useLocation();
	return (
		<div>
			<p data-testid="destino">{pathname}</p>
			<p data-testid="motivo">{state?.motivo}</p>
		</div>
	);
}

function montar(sesion = null) {
	return renderConProviders(
		<Routes>
			<Route path="/checkout" element={<Checkout />} />
			<Route path="/carrito" element={<p>Pagina del carrito</p>} />
			<Route path="/pago/*" element={<Destino />} />
		</Routes>,
		{ ruta: "/checkout", sesion },
	);
}

// Con sesion, el formulario espera a que la API entregue la cuenta para completar los datos de envio.
const formularioListo = () => screen.findByRole("button", { name: /^(Pagar|Confirmar)/ });

async function pagarCon(tarjeta, vencimiento = "1299", cvv = "123") {
	await userEvent.type(screen.getByLabelText(/^Numero de la tarjeta/), tarjeta);
	await userEvent.type(screen.getByLabelText(/^Vencimiento/), vencimiento);
	await userEvent.type(screen.getByLabelText(/^Codigo de seguridad/), cvv);
}

const carrito = (...lineas) => guardarCarrito(lineas.map(([producto, cantidad], i) => ({ linea: i + 1, producto, cantidad, armado: null })));

describe("Checkout", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("sin productos", () => {
		it("avisa que no hay nada que pagar", () => {
			montar();

			expect(screen.getByText("Tu carrito esta vacio, no hay nada que pagar.")).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /Pagar/ })).not.toBeInTheDocument();
		});
	});

	describe("invitado", () => {
		beforeEach(() => carrito(["PER-MOUSE-RGB", 1]));

		it("muestra el formulario vacio, la entrega y el pago con tarjeta", () => {
			montar();

			expect(screen.getByRole("heading", { level: 1, name: "Finalizar compra" })).toBeInTheDocument();
			expect(screen.getByLabelText(/^Nombre/)).toHaveValue("");
			expect(screen.getByLabelText(/Despacho a domicilio/)).toBeChecked();
			expect(screen.getByRole("heading", { name: "Pago con tarjeta" })).toBeInTheDocument();
			expect(screen.getByRole("link", { name: "inicia sesion" })).toBeInTheDocument();
		});

		it("el boton muestra el total con el envio a domicilio", () => {
			montar();

			expect(screen.getByRole("button", { name: "Pagar $29.980" })).toBeInTheDocument();
		});

		it("elegir retiro en tienda quita el envio del total", async () => {
			montar();

			await userEvent.click(screen.getByLabelText(/Retiro en tienda/));

			expect(screen.getByRole("button", { name: "Pagar $24.990" })).toBeInTheDocument();
		});

		it("enviar vacio muestra los errores, no cobra y no crea la orden", async () => {
			montar();
			const antes = ordenes().length;

			await userEvent.click(screen.getByRole("button", { name: /^Pagar/ }));

			expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(6);
			expect(screen.getByText("Selecciona tu region.")).toBeInTheDocument();
			expect(ordenes()).toHaveLength(antes);
		});

		it("da formato a la tarjeta y al vencimiento mientras se escribe", async () => {
			montar();

			await pagarCon("4242424242424242", "1299");

			expect(screen.getByLabelText(/^Numero de la tarjeta/)).toHaveValue("4242 4242 4242 4242");
			expect(screen.getByLabelText(/^Vencimiento/)).toHaveValue("12/99");
		});

		it("rechaza una tarjeta con el digito de control invalido", async () => {
			montar();

			await userEvent.type(screen.getByLabelText(/^Numero de la tarjeta/), "4242424242424241");

			expect(screen.getByText("El numero de la tarjeta no es valido: revisa los digitos.")).toBeInTheDocument();
		});

		it("rechaza una tarjeta vencida", async () => {
			montar();

			await userEvent.type(screen.getByLabelText(/^Vencimiento/), "0120");

			expect(screen.getByText("La tarjeta esta vencida.")).toBeInTheDocument();
		});
		it("un invitado compra sin enviar token y ve su boleta aunque no pueda consultarla", async () => {
			montar();
			await userEvent.type(screen.getByLabelText(/^Nombre/), "Pedro");
			await userEvent.type(screen.getByLabelText(/^Apellidos/), "Rojas");
			await userEvent.type(screen.getByLabelText(/^Correo/), "pedro@gmail.com");
			await userEvent.selectOptions(screen.getByLabelText(/^Region/), "RM");
			await userEvent.selectOptions(screen.getByLabelText(/^Comuna/), "RM-01");
			await userEvent.type(screen.getByLabelText(/^Direccion/), "Calle 1");
			await pagarCon("4242424242424242");

			await userEvent.click(screen.getByRole("button", { name: "Pagar $29.980" }));

			expect(await screen.findByTestId("destino")).toHaveTextContent(/^\/pago\/correcto\/ORD-/);
			const compra = llamadas.find((l) => l.metodo === "POST" && l.ruta === "/boletas");
			expect(compra.autorizacion).toBeNull();
			// Un invitado no puede volver a pedir su boleta: queda la que devolvio la compra.
			const numero = screen.getByTestId("destino").textContent.split("/").pop();
			expect(orden(numero)).toMatchObject({ cliente: "", nombre: "Pedro Rojas" });
		});
	});

	describe("con la sesion iniciada", () => {
		beforeEach(() => carrito(["PER-MOUSE-RGB", 1]));

		it("completa solos los datos de la cuenta, que se piden a GET /usuarios/me", async () => {
			montar(CAMILA);
			await formularioListo();

			expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Camila");
			expect(screen.getByLabelText(/^Apellidos/)).toHaveValue("Soto Vera");
			expect(screen.getByLabelText(/^Correo/)).toHaveValue("camila@gmail.com");
			expect(screen.getByLabelText(/^Direccion/)).toHaveValue("Irarrazaval 2550, Nunoa");
			expect(screen.getByLabelText(/Comuna/)).toHaveValue("RM-04");
			expect(screen.queryByRole("link", { name: "inicia sesion" })).not.toBeInTheDocument();
			expect(llamadas.some((l) => l.metodo === "GET" && l.ruta === "/usuarios/me")).toBe(true);
		});

		it("un pago aprobado crea la orden, descuenta el stock y vacia el carrito", async () => {
			montar(CAMILA);
			await formularioListo();
			const suyasAntes = ordenes().filter((o) => o.cliente === "123456785").length;
			const stockAntes = producto("PER-MOUSE-RGB").stock;

			await pagarCon("4242424242424242");
			await userEvent.click(screen.getByRole("button", { name: "Pagar $29.980" }));

			expect(await screen.findByTestId("destino")).toHaveTextContent(/^\/pago\/correcto\/ORD-\d{4}-\d{4}$/);
			// Tras comprar se vuelven a leer las boletas de la cuenta.
			expect(ordenes()).toHaveLength(suyasAntes + 1);
			expect(ordenes().at(-1)).toMatchObject({
				cliente: "123456785",
				medioPago: "Tarjeta terminada en 4242",
				entrega: "DOMICILIO",
				costoEnvio: 4990,
			});
			expect(producto("PER-MOUSE-RGB").stock).toBe(stockAntes - 1);
			expect(JSON.parse(window.localStorage.getItem("carrito"))).toEqual([]);
		});

		it("la compra va a POST /boletas con las lineas, sin precios ni RUN: la cuenta sale del token", async () => {
			montar(CAMILA);
			await formularioListo();

			await pagarCon("4242424242424242");
			await userEvent.click(screen.getByRole("button", { name: "Pagar $29.980" }));
			await screen.findByTestId("destino");

			const compra = llamadas.find((l) => l.metodo === "POST" && l.ruta === "/boletas");
			expect(compra.autorizacion).toBe("Bearer CLIENTE:123456785");
			expect(compra.cuerpo).toEqual({
				nombre: "Camila Soto Vera",
				correo: "camila@gmail.com",
				direccion: "Irarrazaval 2550, Nunoa",
				comuna: "RM-04",
				entrega: "DOMICILIO",
				medioPago: "Tarjeta terminada en 4242",
				lineas: [{ sku: "PER-MOUSE-RGB", cantidad: 1 }],
			});
		});

		it("una tarjeta rechazada lleva a la pagina de error con el motivo y no crea la orden", async () => {
			montar(CAMILA);
			await formularioListo();
			const ordenesAntes = ordenes().length;

			await pagarCon("4000000000000002");
			await userEvent.click(screen.getByRole("button", { name: "Pagar $29.980" }));

			expect(await screen.findByTestId("destino")).toHaveTextContent("/pago/error");
			expect(screen.getByTestId("motivo")).toHaveTextContent("La tarjeta fue rechazada por el banco emisor.");
			expect(ordenes()).toHaveLength(ordenesAntes);
			expect(llamadas.some((l) => l.metodo === "POST" && l.ruta === "/boletas")).toBe(false);
			expect(JSON.parse(window.localStorage.getItem("carrito"))).toHaveLength(1);
		});

		it("una tarjeta sin fondos muestra su propio motivo", async () => {
			montar(CAMILA);
			await formularioListo();

			await pagarCon("4000000000009995");
			await userEvent.click(screen.getByRole("button", { name: /^Pagar/ }));

			expect(await screen.findByTestId("motivo")).toHaveTextContent("La tarjeta no tiene fondos suficientes.");
		});

		it("si el stock cambio antes de pagar avisa y no cobra", async () => {
			carrito(["PER-MOUSE-RGB", 2]);
			montar(CAMILA);
			await formularioListo();
			// Alguien compro casi todo el stock desde otra pestana despues de cargar el checkout.
			// La interfaz sigue con el stock viejo: quien decide es el servidor.
			baseDeDatos().productos.find((p) => p.sku === "PER-MOUSE-RGB").stock = 1;

			await pagarCon("4242424242424242");
			await userEvent.click(screen.getByRole("button", { name: /^Pagar/ }));

			expect(await screen.findByRole("alert")).toHaveTextContent("Sin stock suficiente");
			expect(screen.queryByTestId("destino")).not.toBeInTheDocument();
			// El catalogo se vuelve a leer y el carrito se ajusta al stock que queda.
			expect(JSON.parse(window.localStorage.getItem("carrito"))[0].cantidad).toBe(2);
			expect(producto("PER-MOUSE-RGB").stock).toBe(1);
		});
	});

	describe("pedido sin costo", () => {
		it("con un producto gratis y retiro en tienda no pide tarjeta", async () => {
			carrito(["PER-MOUSEPAD", 1]);
			montar(SESION_CLIENTE);
			await userEvent.click(await screen.findByLabelText(/Retiro en tienda/));

			expect(screen.queryByRole("heading", { name: "Pago con tarjeta" })).not.toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Confirmar pedido" })).toBeInTheDocument();
			expect(screen.getByText("Este pedido no tiene costo: no necesitas pagar con tarjeta.")).toBeInTheDocument();
		});
	});

	it("ofrece volver al carrito", () => {
		carrito(["PER-MOUSE-RGB", 1]);
		montar();

		expect(screen.getByRole("link", { name: "Volver al carrito" })).toHaveAttribute("href", "/carrito");
	});
});

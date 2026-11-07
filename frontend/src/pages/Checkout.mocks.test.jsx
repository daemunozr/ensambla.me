/*
 * Checkout con la pasarela de pago reemplazada por un mock de modulo (vi.mock):
 * aisla la pagina de la pasarela para comprobar con que tarjeta y monto la
 * llama y como reacciona a su respuesta.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { guardarCarrito } from "../context/carrito.js";
import { autorizarPago } from "../logic/pago.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Checkout from "./Checkout.jsx";

// El mock conserva la implementacion real por defecto y se pisa por prueba.
vi.mock("../logic/pago.js", async (importOriginal) => {
	const original = await importOriginal();
	return { ...original, autorizarPago: vi.fn(original.autorizarPago) };
});

const CAMILA = { run: "123456785", nombre: "Camila", apellidos: "Soto Vera", correo: "camila@gmail.com", rol: "CLIENTE" };

function Destino() {
	const { pathname } = useLocation();
	return <p data-testid="destino">{pathname}</p>;
}

describe("Checkout con la pasarela mockeada", () => {
	beforeEach(() => {
		limpiarAlmacenamiento();
		vi.clearAllMocks();
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }]);
	});

	it("cobra a la pasarela el total con envio y la tarjeta escrita", async () => {
		autorizarPago.mockReturnValueOnce({ aprobado: true });
		renderConProviders(
			<Routes>
				<Route path="/checkout" element={<Checkout />} />
				<Route path="/pago/*" element={<Destino />} />
			</Routes>,
			{ ruta: "/checkout", sesion: CAMILA },
		);

		await userEvent.type(screen.getByLabelText(/^Numero de la tarjeta/), "4242424242424242");
		await userEvent.type(screen.getByLabelText(/^Vencimiento/), "1299");
		await userEvent.type(screen.getByLabelText(/^Codigo de seguridad/), "123");
		await userEvent.click(screen.getByRole("button", { name: "Pagar $29.980" }));

		expect(autorizarPago).toHaveBeenCalledOnce();
		expect(autorizarPago).toHaveBeenCalledWith({ numero: "4242 4242 4242 4242", monto: 29980 });
		expect(screen.getByTestId("destino")).toHaveTextContent(/^\/pago\/correcto\/ORD-/);
	});
});

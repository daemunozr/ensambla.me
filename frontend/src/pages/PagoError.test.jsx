import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CarritoProvider from "../context/CarritoProvider.jsx";
import DatosProvider from "../context/DatosProvider.jsx";
import SesionProvider from "../context/SesionProvider.jsx";
import { limpiarAlmacenamiento } from "../testUtils.jsx";
import PagoError from "./PagoError.jsx";

const CARRITO = [{ linea: 1, producto: "CPU-R5-7600", cantidad: 2, armado: null }];

function montar({ carrito = CARRITO, state } = {}) {
	if (carrito.length) window.localStorage.setItem("carrito", JSON.stringify(carrito));
	return render(
		<MemoryRouter initialEntries={[{ pathname: "/pago/error", state }]}>
			<DatosProvider>
				<SesionProvider>
					<CarritoProvider>
						<PagoError />
					</CarritoProvider>
				</SesionProvider>
			</DatosProvider>
		</MemoryRouter>,
	);
}

describe("PagoError", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el motivo del rechazo y aclara que no hubo cobro (RF-21 CA3)", () => {
		montar({ state: { motivo: "La tarjeta fue rechazada por el emisor." } });

		expect(screen.getByRole("heading", { level: 1, name: "Pago con error" })).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent("La tarjeta fue rechazada por el emisor. No se realizo ningun cobro.");
	});

	it("sin motivo usa un mensaje generico", () => {
		montar();

		expect(screen.getByRole("alert")).toHaveTextContent("No pudimos procesar tu pago. No se realizo ningun cobro.");
	});

	it("el carrito sigue intacto y se muestra su resumen", () => {
		montar();

		expect(screen.getByText("Resumen del pedido")).toBeInTheDocument();
		expect(screen.getByText("AMD Ryzen 5 7600")).toBeInTheDocument();
		expect(window.localStorage.getItem("carrito")).toBe(JSON.stringify(CARRITO));
	});

	it("sin entrega elegida el envio queda por calcular", () => {
		montar();

		expect(screen.getByText("Segun la entrega")).toBeInTheDocument();
	});

	it("con la entrega a domicilio suma el costo de envio al total", () => {
		montar({
			carrito: [{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }],
			state: { datos: { entrega: "DOMICILIO" } },
		});

		expect(screen.queryByText("Segun la entrega")).not.toBeInTheDocument();
		expect(screen.getByText("Envio").nextElementSibling).toHaveTextContent("$4.990");
	});

	it("con retiro en tienda el envio es gratis", () => {
		montar({ state: { datos: { entrega: "RETIRO" } } });

		expect(screen.getByText("Envio").nextElementSibling).toHaveTextContent("Gratis");
	});

	it("«Reintentar el pago» vuelve al checkout y «Volver al carrito» al carrito", () => {
		montar({ state: { datos: { entrega: "RETIRO", nombre: "Ana" } } });

		expect(screen.getByRole("link", { name: "Reintentar el pago" })).toHaveAttribute("href", "/checkout");
		expect(screen.getByRole("link", { name: "Volver al carrito" })).toHaveAttribute("href", "/carrito");
	});

	it("con el carrito vacio no hay pago pendiente", () => {
		montar({ carrito: [] });

		expect(screen.getByText("No hay ningun pago pendiente: tu carrito esta vacio.")).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Reintentar el pago" })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
	});
});

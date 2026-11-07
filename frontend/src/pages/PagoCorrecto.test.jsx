import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { usuario } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import PagoCorrecto from "./PagoCorrecto.jsx";

const CAMILA = () => sesionDe(usuario("123456785"));

function montar(numero, sesion = null) {
	return renderConProviders(
		<Routes>
			<Route path="/pago/correcto/:numero" element={<PagoCorrecto />} />
		</Routes>,
		{ ruta: `/pago/correcto/${numero}`, sesion },
	);
}

describe("PagoCorrecto", () => {
	beforeEach(limpiarAlmacenamiento);

	it("el dueno ve la confirmacion con la boleta como resumen (RF-21 CA2)", () => {
		montar("ORD-2026-0001", CAMILA());

		expect(screen.getByRole("heading", { level: 1, name: "Pago correcto" })).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent("Gracias por tu compra, Camila Soto Vera");
		expect(screen.getByRole("alert")).toHaveTextContent("ORD-2026-0001");
		expect(screen.getByRole("heading", { name: "Boleta ORD-2026-0001" })).toBeInTheDocument();
	});

	it("ofrece seguir comprando, ver mis compras y volver al inicio", () => {
		montar("ORD-2026-0001", CAMILA());

		expect(screen.getByRole("link", { name: "Seguir comprando" })).toHaveAttribute("href", "/productos");
		expect(screen.getByRole("link", { name: "Ver mis compras" })).toHaveAttribute("href", "/mis-compras");
		expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
	});

	it("el personal ve la orden de un invitado, sin «Ver mis compras»", () => {
		// ORD-2026-0007 es de un invitado ("cliente" vacio): nadie es su dueno.
		montar("ORD-2026-0007", sesionDe(usuario("190110222")));

		expect(screen.getByRole("heading", { level: 1, name: "Pago correcto" })).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Ver mis compras" })).not.toBeInTheDocument();
	});

	it("la orden de un invitado se ve con su enlace, aun sin sesion", () => {
		montar("ORD-2026-0007");

		expect(screen.getByRole("alert")).toHaveTextContent("Gracias por tu compra, Sofia Contreras Pino");
		expect(screen.queryByRole("link", { name: "Ver mis compras" })).not.toBeInTheDocument();
	});

	it("la orden de otra cuenta se trata como inexistente, sin revelar que existe (RF-21 CA4)", () => {
		montar("ORD-2026-0002", CAMILA());

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: /^Boleta/ })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
	});

	it("una orden que no existe muestra el mismo aviso", () => {
		montar("ORD-9999-0001", CAMILA());

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
		expect(screen.getByText("ORD-9999-0001")).toBeInTheDocument();
	});

	it("sin sesion no se puede ver una orden de una cuenta", () => {
		montar("ORD-2026-0001");

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
	});
});

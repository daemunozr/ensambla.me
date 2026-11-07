import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { usuario } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import MiCompra from "./MiCompra.jsx";

function montar(numero, run = "123456785") {
	return renderConProviders(
		<Routes>
			<Route path="/mis-compras/:numero" element={<MiCompra />} />
		</Routes>,
		{ ruta: `/mis-compras/${numero}`, sesion: sesionDe(usuario(run)) },
	);
}

describe("MiCompra", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra la boleta de una compra propia (RF-24 CA3)", () => {
		montar("ORD-2026-0001");

		expect(screen.getByRole("heading", { level: 1, name: "Compra ORD-2026-0001" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Boleta ORD-2026-0001" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver a mis compras" })).toHaveAttribute("href", "/mis-compras");
	});

	it("una compra de otra cuenta aparece como «Orden no encontrada»", () => {
		montar("ORD-2026-0002");

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: /^Boleta/ })).not.toBeInTheDocument();
	});

	it("la orden de un invitado tampoco se muestra", () => {
		montar("ORD-2026-0007");

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
	});

	it("un numero inexistente muestra el aviso con el enlace a mis compras", () => {
		montar("ORD-0000-0000");

		expect(screen.getByText("ORD-0000-0000")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ver mis compras" })).toHaveAttribute("href", "/mis-compras");
	});
});

import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { SESION_LOGISTICA, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import OrdenAdmin from "./Orden.jsx";

function montar(numero) {
	return renderConProviders(
		<Routes>
			<Route path="/admin/ordenes/:numero" element={<OrdenAdmin />} />
		</Routes>,
		{ ruta: `/admin/ordenes/${numero}`, sesion: SESION_LOGISTICA },
	);
}

describe("admin / Orden", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra la boleta de la orden en solo lectura (RF-12 CA2)", () => {
		montar("ORD-2026-0002");

		expect(screen.getByRole("heading", { level: 1, name: "Orden ORD-2026-0002" })).toBeInTheDocument();
		expect(screen.getByText("Vista de solo lectura.")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Boleta ORD-2026-0002" })).toBeInTheDocument();
		expect(screen.getByText(/Matias Rivas Gomez/)).toBeInTheDocument();
	});

	it("tambien muestra la orden de un invitado", () => {
		montar("ORD-2026-0007");

		expect(screen.getByText(/Invitado \(sin cuenta\)/)).toBeInTheDocument();
	});

	it("ofrece volver al listado de ordenes", () => {
		montar("ORD-2026-0002");

		expect(screen.getByRole("link", { name: "Volver a las ordenes" })).toHaveAttribute("href", "/admin/ordenes");
	});

	it("un numero inexistente muestra «Orden no encontrada»", () => {
		montar("ORD-0000-0000");

		expect(screen.getByRole("heading", { level: 1, name: "Orden no encontrada" })).toBeInTheDocument();
		expect(screen.getByText("ORD-0000-0000")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: /^Boleta/ })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver a las ordenes" })).toBeInTheDocument();
	});
});

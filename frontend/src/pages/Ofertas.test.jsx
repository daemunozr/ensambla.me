import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { productos } from "../data/datos.js";
import { enOferta } from "../logic/precios.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Ofertas from "./Ofertas.jsx";

function montar(ruta = "/ofertas") {
	return renderConProviders(
		<Routes>
			<Route path="/ofertas" element={<Ofertas />} />
		</Routes>,
		{ ruta },
	);
}

describe("Ofertas", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra solo los productos con descuento", () => {
		montar();
		const enOfertas = productos().filter(enOferta);

		expect(screen.getAllByRole("article")).toHaveLength(enOfertas.length);
		expect(screen.getByText(`${enOfertas.length} de ${enOfertas.length} productos en oferta.`)).toBeInTheDocument();
	});

	it("ordena por mayor descuento", () => {
		montar();
		const porcentajes = screen.getAllByRole("article").map((tarjeta) => Number(/-(\d+)%/.exec(tarjeta.textContent)[1]));

		expect(porcentajes).toEqual([...porcentajes].sort((a, b) => b - a));
	});

	it("no ofrece el filtro de solo ofertas", () => {
		montar();

		expect(screen.queryByLabelText("Solo ofertas")).not.toBeInTheDocument();
		expect(screen.getByLabelText("Solo con stock")).toBeInTheDocument();
	});

	it("una busqueda sin resultados muestra el mensaje de filtros", () => {
		montar("/ofertas?q=zzzzzz");

		expect(screen.getByText(/Ninguna oferta coincide con los filtros/)).toBeInTheDocument();
	});

	it("sin productos en oferta lo avisa y lleva al catalogo", () => {
		window.sessionStorage.setItem("productos", JSON.stringify(productos().map((p) => ({ ...p, descuento: 0 }))));
		montar();

		expect(screen.getByText("Por ahora no hay productos en oferta.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
		expect(screen.queryByRole("search")).not.toBeInTheDocument();
	});
});

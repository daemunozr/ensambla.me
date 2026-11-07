import { screen } from "@testing-library/react";
import { productos } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import RejillaProductos from "./RejillaProductos.jsx";

describe("RejillaProductos", () => {
	beforeEach(limpiarAlmacenamiento);

	it("renderiza una tarjeta por cada producto", () => {
		const lista = productos().slice(0, 4);
		renderConProviders(<RejillaProductos productos={lista} mensajeVacio="Nada" />);

		expect(screen.getAllByRole("article")).toHaveLength(4);
		lista.forEach((p) => expect(screen.getByRole("link", { name: p.nombre })).toBeInTheDocument());
	});

	it("sin productos muestra el mensaje en lugar de un area en blanco", () => {
		renderConProviders(<RejillaProductos productos={[]} mensajeVacio="No hay productos en oferta." />);

		expect(screen.getByText("No hay productos en oferta.")).toBeInTheDocument();
		expect(screen.queryByRole("article")).not.toBeInTheDocument();
	});
});

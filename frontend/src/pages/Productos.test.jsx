import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { productos } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Productos from "./Productos.jsx";

function montar(ruta = "/productos") {
	return renderConProviders(
		<Routes>
			<Route path="/productos" element={<Productos />} />
		</Routes>,
		{ ruta },
	);
}

describe("Productos", () => {
	beforeEach(limpiarAlmacenamiento);

	it("sin filtros muestra todo el catalogo", () => {
		montar();
		const total = productos().length;

		expect(screen.getByRole("heading", { level: 1, name: "Todos los productos" })).toBeInTheDocument();
		expect(screen.getAllByRole("article")).toHaveLength(total);
		expect(screen.getByText(`${total} productos en el catalogo.`)).toBeInTheDocument();
		expect(document.title).toBe("Productos — Ensambla.me");
	});

	it("la busqueda de la URL deja solo los productos que coinciden", () => {
		montar("/productos?q=CPU-R5-7600");

		expect(screen.getAllByRole("article")).toHaveLength(1);
		expect(screen.getByText("1 producto coincide con tu busqueda.")).toBeInTheDocument();
	});

	it("sin coincidencias muestra el mensaje de estado vacio", () => {
		montar("/productos?q=zzzzzz");

		expect(screen.queryByRole("article")).not.toBeInTheDocument();
		expect(screen.getByText(/Ningun producto coincide con los filtros/)).toBeInTheDocument();
	});

	it("una categoria de la URL cambia el titulo y filtra los productos", () => {
		montar("/productos?categoria=cpu");

		expect(screen.getByRole("heading", { level: 1, name: "Procesadores (CPU)" })).toBeInTheDocument();
		const tarjetas = screen.getAllByRole("article");
		expect(tarjetas.length).toBeGreaterThan(0);
		tarjetas.forEach((tarjeta) => expect(within(tarjeta).getByText("Procesadores (CPU)")).toBeInTheDocument());
	});

	it("una categoria que no existe se ignora", () => {
		montar("/productos?categoria=zzz");

		expect(screen.getByRole("heading", { level: 1, name: "Todos los productos" })).toBeInTheDocument();
		expect(screen.getAllByRole("article")).toHaveLength(productos().length);
	});

	it("buscar desde el formulario actualiza la lista", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "CPU-R5-7600");
		await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(screen.getAllByRole("article")).toHaveLength(1);
	});

	it("elegir una categoria en el filtro actualiza la lista y el titulo", async () => {
		montar();

		await userEvent.selectOptions(screen.getByLabelText("Categoria"), "gpu");

		expect(screen.getByRole("heading", { level: 1, name: "Tarjetas graficas" })).toBeInTheDocument();
	});

	it("Limpiar filtros vuelve a mostrar todo", async () => {
		montar("/productos?q=zzzzzz");

		await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

		expect(screen.getAllByRole("article")).toHaveLength(productos().length);
	});

	it("solo ofertas deja los productos con descuento", async () => {
		montar();

		await userEvent.click(screen.getByLabelText("Solo ofertas"));

		const tarjetas = screen.getAllByRole("article");
		expect(tarjetas.length).toBeLessThan(productos().length);
		tarjetas.forEach((tarjeta) => expect(tarjeta).toHaveTextContent(/-\d+%/));
	});
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { categoria, categorias, crearCategoria, productos } from "../../data/datos.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import CategoriasAdmin from "./Categorias.jsx";

function montar(ruta = "/admin/categorias") {
	return renderConProviders(
		<Routes>
			<Route path="/admin/categorias" element={<CategoriasAdmin />} />
		</Routes>,
		{ ruta, sesion: SESION_ADMIN },
	);
}
const filaDe = (codigo) => screen.getByText(codigo, { selector: "code" }).closest("tr");
const eliminar = async (codigo) => {
	await userEvent.click(within(filaDe(codigo)).getByRole("button", { name: "Eliminar" }));
	await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
};

describe("admin / Categorias", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista cada categoria con su codigo, paso del asistente y numero de productos (RF-25 CA1)", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Categorias" })).toBeInTheDocument();
		expect(screen.getByText(`${categorias().length} categorias en el catalogo.`)).toBeInTheDocument();
		expect(screen.getAllByRole("row")).toHaveLength(categorias().length + 1);
		const cpu = filaDe("cpu");
		expect(cpu).toHaveTextContent("Procesadores (CPU)");
		expect(within(cpu).getAllByRole("cell")[2]).toHaveTextContent("1");
		expect(within(cpu).getAllByRole("cell")[3]).toHaveTextContent(String(productos().filter((p) => p.categoria === "cpu").length));
	});

	it("una categoria que no es paso del asistente muestra una raya", () => {
		crearCategoria({ codigo: "sillas", nombre: "Sillas gamer" });
		montar();

		expect(within(filaDe("sillas")).getAllByRole("cell")[2]).toHaveTextContent("—");
		expect(within(filaDe("sillas")).getAllByRole("cell")[3]).toHaveTextContent("0");
	});

	it("ofrece crear, editar y ver la categoria en el catalogo", () => {
		montar();

		expect(screen.getByRole("link", { name: "Nueva categoria" })).toHaveAttribute("href", "/admin/categorias/nueva");
		expect(within(filaDe("cpu")).getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/admin/categorias/cpu/editar");
		expect(within(filaDe("cpu")).getByRole("link", { name: "Procesadores (CPU)" })).toHaveAttribute("href", "/productos?categoria=cpu");
	});

	it("avisa de la categoria recien guardada que viene en la URL", () => {
		montar("/admin/categorias?guardada=Monitores");

		expect(screen.getByRole("alert")).toHaveTextContent("La categoria Monitores se guardo correctamente.");
	});

	describe("eliminar (RF-25 CA4)", () => {
		it("pide confirmacion y cancelar no elimina", async () => {
			crearCategoria({ codigo: "sillas", nombre: "Sillas gamer" });
			montar();

			await userEvent.click(within(filaDe("sillas")).getByRole("button", { name: "Eliminar" }));
			expect(screen.getByRole("dialog", { name: "Eliminar categoria" })).toHaveTextContent("Sillas gamer");
			await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(categoria("sillas")).toBeDefined();
		});

		it("elimina una categoria sin productos que no es paso del asistente", async () => {
			crearCategoria({ codigo: "sillas", nombre: "Sillas gamer" });
			montar();

			await eliminar("sillas");

			expect(categoria("sillas")).toBeUndefined();
			expect(screen.queryByText("sillas", { selector: "code" })).not.toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveClass("alert-success");
		});

		it("rechaza una categoria que es paso del asistente", async () => {
			montar();

			await eliminar("cpu");

			expect(categoria("cpu")).toBeDefined();
			expect(screen.getByRole("alert")).toHaveClass("alert-danger");
			expect(screen.getByRole("alert")).toHaveTextContent("es el paso 1 del asistente de armado y no se puede eliminar");
		});

		it("rechaza una categoria con productos", async () => {
			crearCategoria({ codigo: "sillas", nombre: "Sillas gamer" });
			window.sessionStorage.setItem(
				"productos",
				JSON.stringify([...productos(), { sku: "SILLA-1", nombre: "Silla", precio: 1, stock: 1, categoria: "sillas" }]),
			);
			montar();

			await eliminar("sillas");

			expect(categoria("sillas")).toBeDefined();
			expect(screen.getByRole("alert")).toHaveTextContent("tiene 1 producto");
		});
	});

	it("sin categorias muestra que no hay cargadas", () => {
		window.sessionStorage.setItem("categorias", "[]");
		montar();

		expect(screen.getByText("No hay categorias cargadas.")).toBeInTheDocument();
	});
});

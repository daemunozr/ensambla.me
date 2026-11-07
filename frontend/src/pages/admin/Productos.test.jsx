import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { itemsOrden, producto, productos } from "../../data/datos.js";
import { SESION_ADMIN, SESION_LOGISTICA, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import ProductosAdmin from "./Productos.jsx";
import { guardarDatos } from "../../testing/apiFalsa.js";

const LOGISTICA = SESION_LOGISTICA;

function montar(sesion = SESION_ADMIN, ruta = "/admin/productos") {
	return renderConProviders(
		<Routes>
			<Route path="/admin/productos" element={<ProductosAdmin />} />
		</Routes>,
		{ ruta, sesion },
	);
}

describe("admin / Productos", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista todos los productos del catalogo", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Productos" })).toBeInTheDocument();
		// Una fila de encabezado mas una por producto.
		expect(screen.getAllByRole("row")).toHaveLength(productos().length + 1);
		expect(screen.getByText(`${productos().length} productos en el catalogo.`)).toBeInTheDocument();
	});

	it("el administrador puede crear, editar y eliminar", () => {
		montar();

		expect(screen.getByRole("link", { name: "Nuevo producto" })).toHaveAttribute("href", "/admin/productos/nuevo");
		expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Eliminar" })).toHaveLength(productos().length);
	});

	it("el administrador logistico lo ve en solo lectura", () => {
		montar(LOGISTICA);

		expect(screen.getByText(/Vista de solo lectura/)).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Nuevo producto" })).not.toBeInTheDocument();
		expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Productos criticos" })).toBeInTheDocument();
	});

	it("la busqueda reduce las filas y actualiza el conteo", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "CPU-R5-7600");

		expect(screen.getAllByRole("row")).toHaveLength(2);
		expect(screen.getByText(`Mostrando 1 de ${productos().length}.`)).toBeInTheDocument();
	});

	it("una busqueda sin resultados muestra el estado vacio", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "zzzzzz");

		expect(screen.getByText("Ningun producto coincide con la busqueda.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("marca los productos en stock critico", () => {
		guardarDatos("productos", [{ ...producto("CPU-R5-7600"), stock: 1, stockCritico: 5 }]);
		montar();

		expect(screen.getByText("Stock critico")).toBeInTheDocument();
	});

	it("avisa del producto recien guardado que viene en la URL", () => {
		montar(SESION_ADMIN, "/admin/productos?guardado=CPU-R5-7600");

		expect(screen.getByRole("alert")).toHaveTextContent("El producto CPU-R5-7600 se guardo correctamente.");
	});

	describe("eliminar", () => {
		const filaDe = (sku) => screen.getByText(sku).closest("tr");

		it("pide confirmacion antes de eliminar", async () => {
			montar();

			await userEvent.click(within(filaDe("CPU-R5-7600")).getByRole("button", { name: "Eliminar" }));

			const dialogo = screen.getByRole("dialog", { name: "Eliminar producto" });
			expect(dialogo).toHaveTextContent("AMD Ryzen 5 7600");
			expect(producto("CPU-R5-7600")).toBeDefined();
		});

		it("cancelar no elimina nada", async () => {
			montar();

			await userEvent.click(within(filaDe("CPU-R5-7600")).getByRole("button", { name: "Eliminar" }));
			await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(producto("CPU-R5-7600")).toBeDefined();
			expect(screen.getAllByRole("row")).toHaveLength(productos().length + 1);
		});

		const sinVentas = () => productos().find((p) => !itemsOrden().some((i) => i.producto === p.sku));

		async function confirmarEliminacion(sku) {
			await userEvent.click(within(filaDe(sku)).getByRole("button", { name: "Eliminar" }));
			await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
			await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		}

		it("confirmar elimina el producto, quita su fila y avisa", async () => {
			montar();
			const total = productos().length;
			const { sku } = sinVentas();

			await confirmarEliminacion(sku);

			expect(producto(sku)).toBeUndefined();
			expect(screen.queryByText(sku)).not.toBeInTheDocument();
			expect(screen.getAllByRole("row")).toHaveLength(total);
			expect(screen.getByRole("alert")).toHaveTextContent(sku);
		});

		it("un producto que figura en boletas no se elimina y el servidor explica por que", async () => {
			montar();

			await confirmarEliminacion("CPU-R5-7600");

			expect(producto("CPU-R5-7600")).toBeDefined();
			expect(screen.getByRole("alert")).toHaveClass("alert-danger");
			expect(screen.getByRole("alert")).toHaveTextContent("figura en boletas");
		});
	});
});

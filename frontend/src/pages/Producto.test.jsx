import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { producto } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Producto from "./Producto.jsx";

function montar(sku) {
	return renderConProviders(
		<Routes>
			<Route path="/productos/:sku" element={<Producto />} />
		</Routes>,
		{ ruta: `/productos/${sku}` },
	);
}

describe("Producto", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra la ficha del producto", () => {
		const ryzen = producto("CPU-R5-7600");
		montar("CPU-R5-7600");

		expect(screen.getByRole("heading", { level: 1, name: ryzen.nombre })).toBeInTheDocument();
		expect(screen.getByText(ryzen.descripcion)).toBeInTheDocument();
		expect(screen.getByText("Codigo (SKU)").nextElementSibling).toHaveTextContent("CPU-R5-7600");
		expect(screen.getByText("Stock").nextElementSibling).toHaveTextContent(`${ryzen.stock} unidades`);
		expect(screen.getByRole("img", { name: ryzen.nombre })).toBeInTheDocument();
		expect(document.title).toBe(`${ryzen.nombre} — Ensambla.me`);
	});

	it("la miga de pan enlaza al catalogo y a la categoria", () => {
		montar("CPU-R5-7600");

		expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute("href", "/productos");
		expect(screen.getByRole("link", { name: "Procesadores (CPU)" })).toHaveAttribute("href", "/productos?categoria=cpu");
	});

	it("un codigo que no existe avisa en vez de dejar la vista vacia", () => {
		montar("NO-EXISTE");

		expect(screen.getByRole("heading", { level: 1, name: "Producto no encontrado" })).toBeInTheDocument();
		expect(screen.getByText("NO-EXISTE")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver al catalogo" })).toHaveAttribute("href", "/productos");
		expect(document.title).toBe("Producto no encontrado — Ensambla.me");
	});

	it("un producto en stock critico muestra la alerta de ultimas unidades", () => {
		window.sessionStorage.setItem("productos", JSON.stringify([{ ...producto("CPU-R5-7600"), stock: 2, stockCritico: 5 }]));
		montar("CPU-R5-7600");

		expect(screen.getByText("Ultimas unidades disponibles")).toBeInTheDocument();
	});

	it("un producto con stock holgado no muestra la alerta", () => {
		montar("CPU-R5-7600");

		expect(screen.queryByText("Ultimas unidades disponibles")).not.toBeInTheDocument();
	});

	it("un producto sin descripcion lo indica", () => {
		window.sessionStorage.setItem("productos", JSON.stringify([{ ...producto("CPU-R5-7600"), descripcion: "" }]));
		montar("CPU-R5-7600");

		expect(screen.getByText("Este producto todavia no tiene descripcion.")).toBeInTheDocument();
	});

	it("el video solo aparece si el producto lo define", () => {
		const { unmount } = montar("CPU-R5-7600");
		expect(screen.queryByRole("heading", { name: "Video del producto" })).not.toBeInTheDocument();
		unmount();

		window.sessionStorage.setItem("productos", JSON.stringify([{ ...producto("CPU-R5-7600"), video: "resources/video/ensamblame.mp4" }]));
		montar("CPU-R5-7600");
		expect(screen.getByRole("heading", { name: "Video del producto" })).toBeInTheDocument();
	});

	it("anadir al carrito guarda el producto", async () => {
		montar("CPU-R5-7600");

		await userEvent.click(screen.getByRole("button", { name: "Anadir al carrito" }));

		expect(JSON.parse(window.localStorage.getItem("carrito"))).toMatchObject([{ producto: "CPU-R5-7600", cantidad: 1 }]);
	});

	it("sin stock el boton queda deshabilitado", () => {
		window.sessionStorage.setItem("productos", JSON.stringify([{ ...producto("CPU-R5-7600"), stock: 0 }]));
		montar("CPU-R5-7600");

		expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
	});
});

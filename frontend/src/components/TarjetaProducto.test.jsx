import { screen } from "@testing-library/react";
import { producto } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import TarjetaProducto from "./TarjetaProducto.jsx";

describe("TarjetaProducto", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el nombre, la categoria y el precio del producto", () => {
		const ryzen = producto("CPU-R5-7600");
		renderConProviders(<TarjetaProducto producto={ryzen} />);

		expect(screen.getByRole("link", { name: ryzen.nombre })).toBeInTheDocument();
		expect(screen.getByText("Procesadores (CPU)")).toBeInTheDocument();
		expect(screen.getByRole("article")).toHaveTextContent("$212.492");
	});

	it("enlaza al detalle del producto desde la imagen y el nombre", () => {
		renderConProviders(<TarjetaProducto producto={producto("CPU-R5-7600")} />);

		const enlaces = screen.getAllByRole("link");
		expect(enlaces).toHaveLength(2);
		enlaces.forEach((enlace) => expect(enlace).toHaveAttribute("href", "/productos/CPU-R5-7600"));
	});

	it("un producto en oferta muestra el descuento", () => {
		renderConProviders(<TarjetaProducto producto={producto("CPU-R5-7600")} />);

		expect(screen.getByText(/-15%/)).toBeInTheDocument();
	});

	it("un producto gratis marca el precio como gratis", () => {
		renderConProviders(<TarjetaProducto producto={producto("PER-MOUSEPAD")} />);

		expect(screen.getByText("Gratis").closest("p")).toHaveClass("precio-gratis");
	});

	it("el titulo usa el nivel de encabezado indicado", () => {
		renderConProviders(<TarjetaProducto producto={producto("CPU-R5-7600")} nivel={2} />);

		expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
	});

	it("con stock ofrece anadir al carrito y sin stock lo deshabilita", () => {
		const { unmount } = renderConProviders(<TarjetaProducto producto={producto("CPU-R5-7600")} />);
		expect(screen.getByRole("button", { name: "Anadir al carrito" })).toBeEnabled();
		unmount();

		renderConProviders(<TarjetaProducto producto={{ ...producto("CPU-R5-7600"), stock: 0 }} />);
		expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
	});
});

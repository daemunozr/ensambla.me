import { screen, within } from "@testing-library/react";
import { producto, productos } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Inicio from "./Inicio.jsx";

const DESTACADOS = ["CPU-R7-7800X3D", "GPU-RTX4070S", "MB-X670-ELITE", "RAM-DDR5-32-6000", "SSD-NVME-1TB", "PER-MONITOR-27"];

describe("Inicio", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el componente principal con su imagen antes del listado (RNF-08 CA2)", () => {
		const { container } = renderConProviders(<Inicio />);

		const portada = screen.getByRole("heading", { level: 1 });
		expect(portada).toHaveTextContent("Arma tu PC gamer pieza por pieza");
		expect(screen.getByRole("img", { name: /Ilustracion de un PC gamer/ })).toBeInTheDocument();
		const destacados = screen.getByRole("heading", { name: "Productos destacados" });
		// Orden del documento: portada, luego el listado.
		expect(portada.compareDocumentPosition(destacados) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(container.querySelectorAll("h1")).toHaveLength(1);
	});

	it("la portada lleva al asistente y al catalogo", () => {
		renderConProviders(<Inicio />);

		expect(screen.getByRole("link", { name: "Armar mi PC" })).toHaveAttribute("href", "/armado");
		expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
	});

	it("lista los productos destacados, uno por tarjeta (RF-03 CA1)", () => {
		renderConProviders(<Inicio />);

		const seccion = screen.getByRole("heading", { name: "Productos destacados" }).closest("section");
		DESTACADOS.forEach((sku) =>
			expect(within(seccion).getByRole("link", { name: `Ver el detalle de ${producto(sku).nombre}` })).toBeInTheDocument(),
		);
		expect(within(seccion).getAllByRole("link", { name: /^Ver el detalle de/ })).toHaveLength(DESTACADOS.length);
	});

	it("si desaparecen los destacados, muestra los primeros seis del catalogo", () => {
		const resto = productos().filter((p) => !DESTACADOS.includes(p.sku));
		window.sessionStorage.setItem("productos", JSON.stringify(resto));
		renderConProviders(<Inicio />);

		const seccion = screen.getByRole("heading", { name: "Productos destacados" }).closest("section");
		const enlaces = within(seccion).getAllByRole("link", { name: /^Ver el detalle de/ });
		expect(enlaces).toHaveLength(6);
		expect(enlaces[0]).toHaveAccessibleName(`Ver el detalle de ${resto[0].nombre}`);
	});

	it("el video del asistente va despues del listado (RNF-08 CA2)", () => {
		const { container } = renderConProviders(<Inicio />);

		const video = container.querySelector("video");
		expect(video).toHaveAttribute("controls");
		expect(video.querySelector("source")).toHaveAttribute("src", expect.stringContaining("resources/video/ensamblame.mp4"));
		const destacados = screen.getByRole("heading", { name: "Productos destacados" });
		expect(destacados.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getByRole("link", { name: "Descargalo aqui" })).toBeInTheDocument();
	});

	it("explica el armado guiado en tres pasos", () => {
		renderConProviders(<Inicio />);

		const seccion = screen.getByRole("heading", { name: "Como funciona el armado guiado" }).closest("section");
		expect(within(seccion).getAllByRole("article")).toHaveLength(3);
		expect(within(seccion).getByText("Paso 1")).toBeInTheDocument();
		expect(within(seccion).getByRole("heading", { name: "Agrega el conjunto al carrito" })).toBeInTheDocument();
	});
});

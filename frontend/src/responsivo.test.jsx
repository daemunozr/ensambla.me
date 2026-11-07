/*
 * Pruebas del diseno responsivo (Bootstrap).
 *
 * jsdom no calcula el diseno ni el ancho de pantalla, asi que aqui solo se
 * comprueba que el marcado trae las clases de Bootstrap que adaptan la vista.
 * La revision con anchos reales (375, 768 y 1280 px) esta en docs/responsividad.md.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Boleta from "./components/Boleta.jsx";
import Nav from "./components/layout/Nav.jsx";
import RejillaProductos from "./components/RejillaProductos.jsx";
import TablaOrdenes from "./components/TablaOrdenes.jsx";
import { itemsDeOrden, orden, ordenes, productos } from "./data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "./testUtils.jsx";

describe("Diseno responsivo", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("menu principal", () => {
		it("se pliega en pantallas chicas con la clase navbar-expand-xl", () => {
			renderConProviders(<Nav />);

			expect(screen.getByRole("navigation", { name: "Navegacion principal" })).toHaveClass("navbar-expand-xl");
		});

		it("el boton del menu lo muestra y lo oculta", async () => {
			renderConProviders(<Nav />);
			const boton = screen.getByRole("button", { name: "Abrir el menu de navegacion" });
			const menu = document.getElementById("menuPrincipal");
			expect(menu).not.toHaveClass("show");

			await userEvent.click(boton);
			expect(menu).toHaveClass("show");
			expect(boton).toHaveAttribute("aria-expanded", "true");

			await userEvent.click(boton);
			expect(menu).not.toHaveClass("show");
		});
	});

	describe("rejilla de productos", () => {
		it("cambia de 1 a 2 y a 3 columnas segun el ancho", () => {
			const { container } = renderConProviders(<RejillaProductos productos={productos().slice(0, 3)} mensajeVacio="Nada" />);

			const rejilla = container.querySelector(".row");
			expect(rejilla).toHaveClass("row-cols-1", "row-cols-sm-2", "row-cols-lg-3");
		});
	});

	describe("tablas", () => {
		it("la tabla de ordenes va dentro de table-responsive para desplazarse sin romper la pagina", () => {
			const { container } = render(
				<MemoryRouter>
					<TablaOrdenes ordenes={ordenes()} rutaDetalle={(numero) => `/ordenes/${numero}`} />
				</MemoryRouter>,
			);

			expect(container.querySelector(".table-responsive > table")).toBeInTheDocument();
		});

		it("la tabla de la boleta va dentro de table-responsive", () => {
			const numero = "ORD-2026-0001";
			const { container } = render(<Boleta orden={orden(numero)} items={itemsDeOrden(numero)} />);

			expect(container.querySelector(".table-responsive > table")).toBeInTheDocument();
		});
	});
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Nav from "./Nav.jsx";

function Ubicacion() {
	const { pathname, search } = useLocation();
	return <p data-testid="ubicacion">{pathname + search}</p>;
}

const montar = (ruta = "/") =>
	renderConProviders(
		<>
			<Nav />
			<Ubicacion />
		</>,
		{ ruta },
	);

const MENU = [
	["Inicio", "/"],
	["Productos", "/productos"],
	["Categorias", "/categorias"],
	["Ofertas", "/ofertas"],
	["Armar mi PC", "/armado"],
	["Blogs", "/blogs"],
	["Nosotros", "/nosotros"],
	["Contacto", "/contacto"],
];

describe("Nav", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el logo y los enlaces del menu en orden (RF-14 CA1, RNF-08 CA1)", () => {
		montar();

		const enlaces = within(screen.getByRole("list")).getAllByRole("link");
		expect(enlaces.map((a) => [a.textContent, a.getAttribute("href")])).toEqual(MENU);
		expect(screen.getByRole("link", { name: /Ensambla/ })).toHaveAttribute("href", "/");
	});

	it("marca como activo el enlace de la vista actual", () => {
		montar("/ofertas");

		expect(screen.getByRole("link", { name: "Ofertas" })).toHaveClass("active");
		expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveClass("active");
	});

	it("Inicio solo se marca en la raiz, no en el resto de las rutas", () => {
		montar("/productos");

		expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveClass("active");
		expect(screen.getByRole("link", { name: "Productos" })).toHaveClass("active");
	});

	it("el carrito muestra la cantidad de items y se actualiza (RF-14 CA2)", () => {
		window.localStorage.setItem(
			"carrito",
			JSON.stringify([
				{ linea: 1, producto: "CPU-R5-7600", cantidad: 2, armado: null },
				{ linea: 2, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null },
			]),
		);
		montar();

		const carrito = screen.getByRole("link", { name: /Carrito/ });
		expect(carrito).toHaveAttribute("href", "/carrito");
		expect(carrito).toHaveTextContent("3 productos en el carrito");
	});

	it("el carrito vacio muestra 0", () => {
		montar();

		expect(screen.getByRole("link", { name: /Carrito/ })).toHaveTextContent("0 productos en el carrito");
	});

	it("la busqueda lleva al catalogo con el texto como filtro (RF-14 CA4)", async () => {
		montar();

		await userEvent.type(screen.getByRole("searchbox", { name: "Buscar productos" }), "ryzen 5");
		await userEvent.click(screen.getByRole("button", { name: "Buscar" }));

		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/productos?q=ryzen%205");
	});

	it("buscar sin texto lleva al catalogo completo", async () => {
		montar("/ofertas");

		await userEvent.type(screen.getByRole("searchbox"), "   {Enter}");

		expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/productos$/);
	});

	it("el boton del menu movil abre y cierra el menu", async () => {
		montar();
		const boton = screen.getByRole("button", { name: "Abrir el menu de navegacion" });
		const menu = document.getElementById("menuPrincipal");
		expect(boton).toHaveAttribute("aria-expanded", "false");
		expect(menu).not.toHaveClass("show");

		await userEvent.click(boton);
		expect(boton).toHaveAttribute("aria-expanded", "true");
		expect(menu).toHaveClass("show");

		await userEvent.click(screen.getByRole("link", { name: "Blogs" }));
		expect(menu).not.toHaveClass("show");
		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/blogs");
	});
});

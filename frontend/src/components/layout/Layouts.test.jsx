import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import { LayoutAdmin, LayoutTienda } from "./Layouts.jsx";

const montar = (disenio, ruta, sesion = null) =>
	renderConProviders(
		<Routes>
			<Route element={disenio}>
				<Route path={ruta} element={<main>Contenido de la vista</main>} />
			</Route>
		</Routes>,
		{ ruta, sesion },
	);

describe("Layouts", () => {
	beforeEach(limpiarAlmacenamiento);

	it("LayoutTienda con barra lateral: encabezado, menu, categorias, contenido y pie", () => {
		montar(<LayoutTienda conAside />, "/productos");

		expect(screen.getByRole("navigation", { name: "Navegacion principal" })).toBeInTheDocument();
		expect(screen.getByRole("navigation", { name: "Categorias del catalogo" })).toBeInTheDocument();
		expect(screen.getByText("Contenido de la vista")).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
		expect(screen.getByRole("banner")).toBeInTheDocument();
	});

	it("LayoutTienda sin barra lateral no muestra las categorias", () => {
		montar(<LayoutTienda />, "/checkout");

		expect(screen.queryByRole("navigation", { name: "Categorias del catalogo" })).not.toBeInTheDocument();
		expect(screen.getByText("Contenido de la vista")).toBeInTheDocument();
		expect(screen.getByRole("navigation", { name: "Navegacion principal" })).toBeInTheDocument();
	});

	it("LayoutAdmin muestra el menu del panel y no el de la tienda", () => {
		montar(<LayoutAdmin />, "/admin", SESION_ADMIN);

		expect(screen.getByRole("navigation", { name: "Menu del panel de administracion" })).toBeInTheDocument();
		expect(screen.queryByRole("navigation", { name: "Navegacion principal" })).not.toBeInTheDocument();
		expect(screen.getByText("Contenido de la vista")).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
		expect(screen.getByText(/^Hola, Admin/)).toBeInTheDocument();
	});
});

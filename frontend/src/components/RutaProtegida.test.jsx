import { screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import { SESION_ADMIN, SESION_CLIENTE, limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import RutaProtegida from "./RutaProtegida.jsx";

function Ubicacion() {
	const { pathname, search } = useLocation();
	return <p data-testid="ubicacion">{pathname + search}</p>;
}

function montar(sesion) {
	return renderConProviders(
		<>
			<Routes>
				<Route
					path="/admin/secreto"
					element={
						<RutaProtegida roles={["ADMIN"]}>
							<p>Contenido del panel</p>
						</RutaProtegida>
					}
				/>
				<Route path="/login" element={<p>Pantalla de login</p>} />
			</Routes>
			<Ubicacion />
		</>,
		{ ruta: "/admin/secreto?pagina=2", sesion },
	);
}

describe("RutaProtegida", () => {
	beforeEach(limpiarAlmacenamiento);

	it("sin sesion redirige al login recordando el destino", () => {
		montar(null);

		expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
		expect(screen.queryByText("Contenido del panel")).not.toBeInTheDocument();
		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/login?destino=%2Fadmin%2Fsecreto%3Fpagina%3D2");
	});

	it("con un rol que no corresponde muestra acceso denegado y no la vista", () => {
		montar(SESION_CLIENTE);

		expect(screen.getByRole("heading", { name: "Acceso denegado" })).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent("Tu rol (Cliente)");
		expect(screen.queryByText("Contenido del panel")).not.toBeInTheDocument();
	});

	it("el enlace de acceso denegado lleva al inicio del rol", () => {
		montar(SESION_CLIENTE);

		expect(screen.getByRole("link", { name: "Ir a donde si tienes acceso" })).toHaveAttribute("href", "/");
	});

	it("con el rol permitido muestra la vista", () => {
		montar(SESION_ADMIN);

		expect(screen.getByText("Contenido del panel")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Acceso denegado" })).not.toBeInTheDocument();
	});
});

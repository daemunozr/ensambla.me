import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { SESION_ADMIN, SESION_CLIENTE, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Header from "./Header.jsx";

function montar(sesion) {
	return renderConProviders(
		<>
			<Header />
			<Routes>
				<Route path="/" element={<p>Tienda publica</p>} />
				<Route path="/admin" element={<p>Panel</p>} />
			</Routes>
		</>,
		{ ruta: "/admin", sesion },
	);
}

describe("Header", () => {
	beforeEach(limpiarAlmacenamiento);

	it("sin sesion ofrece iniciar sesion y registrarse", () => {
		montar(null);

		expect(screen.getByRole("link", { name: "Iniciar sesion" })).toHaveAttribute("href", "/login");
		expect(screen.getByRole("link", { name: "Registrarse" })).toHaveAttribute("href", "/registro");
		expect(screen.queryByRole("button", { name: "Cerrar sesion" })).not.toBeInTheDocument();
	});

	it("un cliente ve su saludo y sus enlaces, sin el panel", () => {
		montar(SESION_CLIENTE);

		expect(screen.getByText("Hola, Cliente (Cliente)")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Mi perfil" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Mis compras" })).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Panel de administracion" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Iniciar sesion" })).not.toBeInTheDocument();
	});

	it("el administrador ve el enlace al panel", () => {
		montar(SESION_ADMIN);

		expect(screen.getByRole("link", { name: "Panel de administracion" })).toHaveAttribute("href", "/admin");
	});

	it("cerrar sesion borra la sesion y lleva a la tienda publica", async () => {
		montar(SESION_ADMIN);

		await userEvent.click(screen.getByRole("button", { name: "Cerrar sesion" }));

		expect(await screen.findByText("Tienda publica")).toBeInTheDocument();
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
		expect(screen.getByRole("link", { name: "Iniciar sesion" })).toBeInTheDocument();
	});
});

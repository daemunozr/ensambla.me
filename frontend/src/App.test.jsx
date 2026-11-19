import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";
import { SESION_CLIENTE, SESION_LOGISTICA } from "./testUtils.jsx";

function renderizarEn(ruta) {
	return render(
		<MemoryRouter initialEntries={[ruta]}>
			<App />
		</MemoryRouter>,
	);
}

describe("App", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
		window.localStorage.clear();
	});

	it("muestra el inicio en la ruta /", async () => {
		renderizarEn("/");

		expect(await screen.findByRole("heading", { level: 1, name: /Arma tu PC gamer/ })).toBeInTheDocument();
		expect(screen.queryByText("Pagina no encontrada")).not.toBeInTheDocument();
	});

	it("muestra la pagina no encontrada en una ruta desconocida", async () => {
		renderizarEn("/no-existe");

		expect(await screen.findByRole("heading", { level: 1, name: "Pagina no encontrada" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
	});

	it("Logistica no entra a «Mis compras»: no es parte de su rol", async () => {
		window.sessionStorage.setItem("sesion", JSON.stringify(SESION_LOGISTICA));
		renderizarEn("/mis-compras");

		expect(await screen.findByRole("heading", { level: 1, name: "Acceso denegado" })).toBeInTheDocument();
	});

	it("un cliente si entra a «Mis compras»", async () => {
		window.sessionStorage.setItem("sesion", JSON.stringify(SESION_CLIENTE));
		renderizarEn("/mis-compras");

		expect(await screen.findByRole("heading", { level: 1, name: "Mis compras" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Acceso denegado" })).not.toBeInTheDocument();
	});
});

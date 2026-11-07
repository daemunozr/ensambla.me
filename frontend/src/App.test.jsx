import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

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

	it("muestra el inicio en la ruta /", () => {
		renderizarEn("/");

		expect(screen.getByRole("heading", { level: 1, name: /Arma tu PC gamer/ })).toBeInTheDocument();
		expect(screen.queryByText("Pagina no encontrada")).not.toBeInTheDocument();
	});

	it("muestra la pagina no encontrada en una ruta desconocida", () => {
		renderizarEn("/no-existe");

		expect(screen.getByRole("heading", { level: 1, name: "Pagina no encontrada" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
	});
});

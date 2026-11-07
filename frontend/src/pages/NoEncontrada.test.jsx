import { screen } from "@testing-library/react";
import { renderConProviders } from "../testUtils.jsx";
import NoEncontrada from "./NoEncontrada.jsx";

describe("NoEncontrada", () => {
	it("avisa que la direccion no existe y ofrece volver al inicio", () => {
		renderConProviders(<NoEncontrada />, { ruta: "/ruta/que/no/existe" });

		expect(screen.getByRole("heading", { level: 1, name: "Pagina no encontrada" })).toBeInTheDocument();
		expect(screen.getByText("La direccion que buscas no existe.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
	});

	it("actualiza el titulo del documento", () => {
		renderConProviders(<NoEncontrada />);

		expect(document.title).toBe("Pagina no encontrada — Ensambla.me");
	});
});

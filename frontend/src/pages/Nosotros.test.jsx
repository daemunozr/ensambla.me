import { screen } from "@testing-library/react";
import { renderConProviders } from "../testUtils.jsx";
import Nosotros from "./Nosotros.jsx";

describe("Nosotros", () => {
	it("describe de que se trata la empresa (RF-15 CA1)", () => {
		renderConProviders(<Nosotros />);

		expect(screen.getByRole("heading", { level: 1, name: "Nosotros" })).toBeInTheDocument();
		expect(screen.getByText(/Ensambla.me es una tienda online chilena/)).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "En que creemos" })).toBeInTheDocument();
	});

	it("presenta a sus desarrolladores (RF-15 CA1)", () => {
		renderConProviders(<Nosotros />);

		expect(screen.getByRole("heading", { name: "Quien desarrolla el sitio" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 3, name: "Daniel Munoz" })).toBeInTheDocument();
		expect(screen.getByText("Desarrollo frontend y modelo de datos")).toBeInTheDocument();
		expect(screen.getByText(/Estudiante de Ingenieria en Informatica de Duoc UC/)).toBeInTheDocument();
	});

	it("tiene un unico h1", () => {
		const { container } = renderConProviders(<Nosotros />);

		expect(container.querySelectorAll("h1")).toHaveLength(1);
	});
});

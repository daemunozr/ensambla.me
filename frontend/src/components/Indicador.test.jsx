import { render, screen } from "@testing-library/react";
import Indicador from "./Indicador.jsx";

describe("Indicador", () => {
	it("muestra el titulo, la cifra y la nota", () => {
		render(<Indicador titulo="Ventas" valor="$1.000" nota="Este mes" />);

		expect(screen.getByText("Ventas")).toBeInTheDocument();
		expect(screen.getByText("$1.000")).toBeInTheDocument();
		expect(screen.getByText("Este mes")).toBeInTheDocument();
	});
});

import { render, screen, within } from "@testing-library/react";
import TablaBarras from "./TablaBarras.jsx";

const FILAS = [
	{ clave: "a", etiqueta: "Alfa", detalle: "2 ordenes", valor: 200, valorTexto: "$200" },
	{ clave: "b", etiqueta: "Beta", valor: 50, valorTexto: "$50" },
];

describe("TablaBarras", () => {
	it("muestra una fila por dato con su etiqueta y el valor como texto", () => {
		render(<TablaBarras titulo="Ingresos" columna="Mes" filas={FILAS} />);

		expect(screen.getByRole("table", { name: "Ingresos" })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Mes" })).toBeInTheDocument();
		const filas = screen.getAllByRole("row").slice(1);
		expect(filas).toHaveLength(2);
		expect(within(filas[0]).getByText("Alfa")).toBeInTheDocument();
		expect(within(filas[0]).getAllByRole("cell")[2]).toHaveTextContent("$200");
	});

	it("el detalle solo aparece si existe", () => {
		render(<TablaBarras titulo="Ingresos" columna="Mes" filas={FILAS} />);

		expect(screen.getByText("2 ordenes")).toBeInTheDocument();
		const beta = screen.getByText("Beta").closest("td");
		expect(beta.querySelector(".small")).toBeNull();
	});

	it("la barra es proporcional al mayor valor y tiene nombre accesible", () => {
		render(<TablaBarras titulo="Ingresos" columna="Mes" filas={FILAS} />);

		const barras = screen.getAllByRole("progressbar");
		expect(barras[0]).toHaveAttribute("max", "200");
		expect(barras[0]).toHaveAttribute("value", "200");
		expect(barras[1]).toHaveAttribute("value", "50");
		expect(barras[1]).toHaveAccessibleName("Beta: $50");
	});

	it("si todos los valores son 0 el maximo no es 0", () => {
		render(<TablaBarras titulo="Ingresos" columna="Mes" filas={[{ clave: "a", etiqueta: "Alfa", valor: 0, valorTexto: "$0" }]} />);

		expect(screen.getByRole("progressbar")).toHaveAttribute("max", "1");
	});

	it("sin filas muestra el mensaje vacio, personalizable", () => {
		const { unmount } = render(<TablaBarras titulo="Ingresos" columna="Mes" filas={[]} />);
		expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		unmount();

		render(<TablaBarras titulo="Ingresos" columna="Mes" filas={[]} mensajeVacio="Nada que ver." />);
		expect(screen.getByText("Nada que ver.")).toBeInTheDocument();
	});
});

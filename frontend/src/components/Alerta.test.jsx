import { render, screen } from "@testing-library/react";
import Alerta, { ZonaAviso } from "./Alerta.jsx";

describe("Alerta", () => {
	it("muestra el contenido con role alert", () => {
		render(<Alerta>Guardado</Alerta>);

		expect(screen.getByRole("alert")).toHaveTextContent("Guardado");
	});

	it("por defecto es de exito", () => {
		render(<Alerta>Guardado</Alerta>);

		expect(screen.getByRole("alert")).toHaveClass("alert", "alert-success");
	});

	it("usa el tipo recibido en la clase de Bootstrap", () => {
		render(<Alerta tipo="danger">Fallo</Alerta>);

		expect(screen.getByRole("alert")).toHaveClass("alert-danger");
	});
});

describe("ZonaAviso", () => {
	it("sin aviso no muestra ninguna alerta", () => {
		render(<ZonaAviso aviso={null} />);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("con aviso muestra la alerta del tipo indicado", () => {
		render(<ZonaAviso aviso={{ tipo: "danger", contenido: "No se pudo eliminar" }} />);

		expect(screen.getByRole("alert")).toHaveTextContent("No se pudo eliminar");
		expect(screen.getByRole("alert")).toHaveClass("alert-danger");
	});

	it("anuncia los avisos a los lectores de pantalla", () => {
		const { container } = render(<ZonaAviso aviso={null} />);

		expect(container.firstChild).toHaveAttribute("aria-live", "polite");
	});
});

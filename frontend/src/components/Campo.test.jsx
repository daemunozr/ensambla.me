import { render, screen } from "@testing-library/react";
import Campo from "./Campo.jsx";

describe("Campo", () => {
	it("asocia la etiqueta con el control por for e id", () => {
		render(<Campo id="nombre" etiqueta="Nombre" />);

		expect(screen.getByLabelText("Nombre")).toHaveAttribute("id", "nombre");
	});

	it("es un input con form-control por defecto", () => {
		render(<Campo id="nombre" etiqueta="Nombre" />);

		const control = screen.getByLabelText("Nombre");
		expect(control.tagName).toBe("INPUT");
		expect(control).toHaveClass("form-control");
	});

	it("pasa las demas props al control", () => {
		render(<Campo id="nombre" etiqueta="Nombre" type="email" maxLength={20} placeholder="Tu nombre" />);

		expect(screen.getByLabelText("Nombre")).toHaveAttribute("type", "email");
		expect(screen.getByLabelText("Nombre")).toHaveAttribute("maxlength", "20");
		expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
	});

	describe("obligatorio", () => {
		it("marca el control como requerido y agrega el asterisco oculto a lectores", () => {
			const { container } = render(<Campo id="nombre" etiqueta="Nombre" obligatorio />);

			expect(screen.getByLabelText(/Nombre/)).toBeRequired();
			expect(container.querySelector(".obligatorio")).toHaveAttribute("aria-hidden", "true");
		});

		it("sin la prop no hay asterisco ni requerido", () => {
			const { container } = render(<Campo id="nombre" etiqueta="Nombre" />);

			expect(screen.getByLabelText("Nombre")).not.toBeRequired();
			expect(container.querySelector(".obligatorio")).not.toBeInTheDocument();
		});
	});

	describe("error y sugerencia", () => {
		it("muestran su texto solo cuando vienen", () => {
			const { rerender, container } = render(<Campo id="a" etiqueta="A" />);
			expect(container.querySelector(".invalid-feedback")).not.toBeInTheDocument();
			expect(container.querySelector(".form-text")).not.toBeInTheDocument();

			rerender(<Campo id="a" etiqueta="A" error="Falta el valor." sugerencia="Ejemplo: 123" />);
			expect(screen.getByText("Falta el valor.")).toHaveClass("invalid-feedback");
			expect(screen.getByText("Ejemplo: 123")).toHaveClass("form-text");
		});
	});

	describe("estado", () => {
		it("is-invalid agrega la clase y aria-invalid true", () => {
			render(<Campo id="a" etiqueta="A" estado="is-invalid" />);

			expect(screen.getByLabelText("A")).toHaveClass("is-invalid");
			expect(screen.getByLabelText("A")).toHaveAttribute("aria-invalid", "true");
		});

		it("is-valid agrega la clase y aria-invalid false", () => {
			render(<Campo id="a" etiqueta="A" estado="is-valid" />);

			expect(screen.getByLabelText("A")).toHaveClass("is-valid");
			expect(screen.getByLabelText("A")).toHaveAttribute("aria-invalid", "false");
		});

		it("sin estado no declara aria-invalid", () => {
			render(<Campo id="a" etiqueta="A" />);

			expect(screen.getByLabelText("A")).not.toHaveAttribute("aria-invalid");
		});
	});

	describe("como", () => {
		it("select usa form-select y muestra sus opciones", () => {
			render(
				<Campo como="select" id="region" etiqueta="Region">
					<option value="RM">Metropolitana</option>
				</Campo>,
			);

			const control = screen.getByLabelText("Region");
			expect(control.tagName).toBe("SELECT");
			expect(control).toHaveClass("form-select");
			expect(screen.getByRole("option", { name: "Metropolitana" })).toBeInTheDocument();
		});

		it("textarea usa form-control", () => {
			render(<Campo como="textarea" id="mensaje" etiqueta="Mensaje" />);

			expect(screen.getByLabelText("Mensaje").tagName).toBe("TEXTAREA");
		});
	});

	it("agrega la clase del contenedor", () => {
		const { container } = render(<Campo id="a" etiqueta="A" className="col-6" />);

		expect(container.firstChild).toHaveClass("col-6");
	});
});

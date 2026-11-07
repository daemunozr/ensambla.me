import { render, screen } from "@testing-library/react";
import PrecioProducto from "./PrecioProducto.jsx";

describe("PrecioProducto", () => {
	it("sin oferta muestra solo el precio", () => {
		const { container } = render(<PrecioProducto producto={{ precio: 100000 }} />);

		expect(container).toHaveTextContent("$100.000");
		expect(container.querySelector("del")).not.toBeInTheDocument();
		expect(screen.queryByText(/de descuento/)).not.toBeInTheDocument();
	});

	it("en oferta muestra el precio vigente, el de lista tachado y el porcentaje", () => {
		const { container } = render(<PrecioProducto producto={{ precio: 100000, descuento: 15 }} />);

		expect(container).toHaveTextContent("$85.000");
		expect(container.querySelector("del")).toHaveTextContent("$100.000");
		expect(container.querySelector(".insignia-oferta")).toHaveTextContent("-15%");
	});

	it("un precio 0 se muestra Gratis", () => {
		const { container } = render(<PrecioProducto producto={{ precio: 0 }} />);

		expect(container).toHaveTextContent("Gratis");
	});

	it("mostrarGratis false muestra el precio en pesos", () => {
		const { container } = render(<PrecioProducto producto={{ precio: 0 }} mostrarGratis={false} />);

		expect(container).toHaveTextContent("$0");
		expect(container).not.toHaveTextContent("Gratis");
	});
});

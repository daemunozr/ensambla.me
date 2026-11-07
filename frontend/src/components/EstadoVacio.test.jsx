import { render, screen } from "@testing-library/react";
import EstadoVacio from "./EstadoVacio.jsx";

describe("EstadoVacio", () => {
	it("muestra el mensaje que recibe", () => {
		render(
			<EstadoVacio>
				<p>No hay productos.</p>
			</EstadoVacio>,
		);

		expect(screen.getByText("No hay productos.")).toBeInTheDocument();
	});
});

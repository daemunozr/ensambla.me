import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toasts from "./Toasts.jsx";

describe("Toasts", () => {
	it("sin avisos no muestra nada", () => {
		const { container } = render(<Toasts avisos={[]} onCerrar={() => {}} />);

		expect(container).toBeEmptyDOMElement();
	});

	it("muestra un toast por aviso", () => {
		render(
			<Toasts
				avisos={[
					{ id: 1, texto: "Se agrego A" },
					{ id: 2, texto: "Se agrego B" },
				]}
				onCerrar={() => {}}
			/>,
		);

		expect(screen.getByText("Se agrego A")).toBeInTheDocument();
		expect(screen.getByText("Se agrego B")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Cerrar" })).toHaveLength(2);
	});

	it("cerrar un toast avisa con su id", async () => {
		const onCerrar = vi.fn();
		render(<Toasts avisos={[{ id: 7, texto: "Se agrego A" }]} onCerrar={onCerrar} />);

		await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

		expect(onCerrar).toHaveBeenCalledTimes(1);
		expect(onCerrar).toHaveBeenCalledWith(7);
	});
});

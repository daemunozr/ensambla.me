import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import CajaBusqueda from "./CajaBusqueda.jsx";

// Caja con su estado, como la usan los listados del panel.
function ConEstado() {
	const [valor, setValor] = useState("");
	return <CajaBusqueda id="buscar" valor={valor} onCambio={setValor} mostrados={2} total={10} />;
}

describe("CajaBusqueda", () => {
	it("muestra la etiqueta y el campo de busqueda", () => {
		render(<CajaBusqueda id="buscar" valor="" onCambio={() => {}} mostrados={10} total={10} placeholder="Nombre o SKU" />);

		expect(screen.getByLabelText("Buscar")).toHaveAttribute("type", "search");
		expect(screen.getByPlaceholderText("Nombre o SKU")).toBeInTheDocument();
	});

	it("usa la etiqueta indicada", () => {
		render(<CajaBusqueda id="buscar" etiqueta="Buscar usuario" valor="" onCambio={() => {}} mostrados={1} total={1} />);

		expect(screen.getByLabelText("Buscar usuario")).toBeInTheDocument();
	});

	it("sin texto indica el total", () => {
		render(<CajaBusqueda id="buscar" valor="" onCambio={() => {}} mostrados={10} total={10} />);

		expect(screen.getByText("10 en total.")).toBeInTheDocument();
	});

	it("con texto indica cuantos resultados se muestran", () => {
		render(<CajaBusqueda id="buscar" valor="ram" onCambio={() => {}} mostrados={3} total={10} />);

		expect(screen.getByText("Mostrando 3 de 10.")).toBeInTheDocument();
	});

	it("escribir avisa con el texto de cada pulsacion", async () => {
		const onCambio = vi.fn();
		render(<CajaBusqueda id="buscar" valor="" onCambio={onCambio} mostrados={10} total={10} />);

		await userEvent.type(screen.getByLabelText("Buscar"), "ab");

		expect(onCambio).toHaveBeenCalledTimes(2);
		expect(onCambio).toHaveBeenNthCalledWith(1, "a");
	});

	it("con estado, el texto escrito se conserva y actualiza el conteo", async () => {
		render(<ConEstado />);

		await userEvent.type(screen.getByLabelText("Buscar"), "ram");

		expect(screen.getByLabelText("Buscar")).toHaveValue("ram");
		expect(screen.getByText("Mostrando 2 de 10.")).toBeInTheDocument();
	});
});

import { render, screen, within } from "@testing-library/react";
import { precio } from "../utils/formato.js";
import { limpiarAlmacenamiento } from "../testUtils.jsx";
import ResumenPedido from "./ResumenPedido.jsx";

const ITEMS = [
	{ producto: "CPU-R5-7600", cantidad: 2, precioUnitario: 1000 },
	{ producto: "SKU-RETIRADO", cantidad: 1, precioUnitario: 500 },
];

describe("ResumenPedido", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista cada producto con su cantidad y el subtotal de la linea", () => {
		render(<ResumenPedido items={ITEMS} subtotal={2500} envio={0} total={2500} />);

		const lista = screen.getByRole("list");
		const primera = within(lista).getByText("AMD Ryzen 5 7600").closest("li");
		expect(primera).toHaveTextContent("x2");
		expect(primera).toHaveTextContent(precio(2000));
	});

	it("un producto que ya no esta en el catalogo se muestra por su codigo", () => {
		render(<ResumenPedido items={ITEMS} subtotal={2500} envio={0} total={2500} />);

		expect(screen.getByText("SKU-RETIRADO")).toBeInTheDocument();
	});

	it("sin entrega elegida el envio queda por calcular", () => {
		render(<ResumenPedido items={ITEMS} subtotal={2500} total={2500} />);

		expect(screen.getByText("Segun la entrega")).toBeInTheDocument();
	});

	it("un envio de 0 es gratis y uno con costo se muestra en pesos", () => {
		const { rerender } = render(<ResumenPedido items={ITEMS} subtotal={2500} envio={0} total={2500} />);
		expect(screen.getByText("Gratis")).toBeInTheDocument();

		rerender(<ResumenPedido items={ITEMS} subtotal={2500} envio={4990} total={7490} />);
		expect(screen.getByText(precio(4990))).toBeInTheDocument();
		expect(screen.getByText(precio(7490))).toBeInTheDocument();
	});

	it("muestra el subtotal y el total que recibe", () => {
		render(<ResumenPedido items={ITEMS} subtotal={2500} envio={0} total={2500} />);

		expect(screen.getByText("Subtotal").nextElementSibling).toHaveTextContent(precio(2500));
		expect(screen.getByText("Total").nextElementSibling).toHaveTextContent(precio(2500));
	});

	it("el resumen es una region con nombre accesible", () => {
		render(<ResumenPedido items={[]} subtotal={0} envio={0} total={0} />);

		expect(screen.getByRole("region", { name: "Resumen del pedido" })).toBeInTheDocument();
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});
});

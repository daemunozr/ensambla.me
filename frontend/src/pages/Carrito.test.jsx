import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { guardarCarrito } from "../context/carrito.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Carrito from "./Carrito.jsx";

const linea = (numero, producto, cantidad, armado = null) => ({ linea: numero, producto, cantidad, armado });

// El total del resumen, que es el unico elemento con la clase "total".
const total = (contenedor) => contenedor.querySelector(".total");

describe("Carrito", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("vacio", () => {
		it("avisa que no hay nada y deshabilita el pago", () => {
			const { container } = renderConProviders(<Carrito />);

			expect(screen.getByRole("heading", { level: 1, name: "Carrito de compras" })).toBeInTheDocument();
			expect(screen.getByText("Tu carrito esta vacio.")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Ir a pagar" })).toBeDisabled();
			expect(screen.queryByRole("link", { name: "Ir a pagar" })).not.toBeInTheDocument();
			expect(total(container)).toHaveTextContent("$0");
		});

		it("ofrece volver al catalogo", () => {
			renderConProviders(<Carrito />);

			expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
		});
	});

	describe("con productos", () => {
		beforeEach(() => {
			guardarCarrito([linea(1, "PER-MOUSE-RGB", 2)]);
		});

		it("muestra la linea con su cantidad y el total", () => {
			const { container } = renderConProviders(<Carrito />);

			expect(screen.getByRole("link", { name: /Logitech G203/ })).toHaveAttribute("href", "/productos/PER-MOUSE-RGB");
			expect(screen.getByLabelText("Cantidad")).toHaveValue(2);
			expect(total(container)).toHaveTextContent("$49.980");
			expect(screen.queryByText("Tu carrito esta vacio.")).not.toBeInTheDocument();
		});

		it("habilita el pago y lleva al checkout", () => {
			renderConProviders(<Carrito />);

			expect(screen.getByRole("link", { name: "Ir a pagar" })).toHaveAttribute("href", "/checkout");
		});

		it("cambiar la cantidad actualiza el total y lo guarda", async () => {
			const { container } = renderConProviders(<Carrito />);
			const cantidad = screen.getByLabelText("Cantidad");

			await userEvent.clear(cantidad);
			await userEvent.type(cantidad, "3");
			await userEvent.tab();

			expect(cantidad).toHaveValue(3);
			expect(total(container)).toHaveTextContent("$74.970");
			expect(JSON.parse(window.localStorage.getItem("carrito"))[0].cantidad).toBe(3);
		});

		it("una cantidad sobre el stock se ajusta al maximo y avisa", async () => {
			renderConProviders(<Carrito />);
			const cantidad = screen.getByLabelText("Cantidad");

			await userEvent.clear(cantidad);
			await userEvent.type(cantidad, "999");
			await userEvent.tab();

			expect(screen.getByText(/Solo puedes llevar 30 unidades/)).toBeInTheDocument();
			expect(cantidad).toHaveValue(30);
		});

		it("eliminar la linea deja el carrito vacio", async () => {
			const { container } = renderConProviders(<Carrito />);

			await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

			expect(screen.getByText("Tu carrito esta vacio.")).toBeInTheDocument();
			expect(total(container)).toHaveTextContent("$0");
			expect(JSON.parse(window.localStorage.getItem("carrito"))).toEqual([]);
		});
	});

	describe("con un armado", () => {
		beforeEach(() => {
			guardarCarrito([linea(1, "CPU-R5-7600", 1, "ARM-X"), linea(2, "PER-MOUSE-RGB", 1, "ARM-X"), linea(3, "PER-KB-MECH", 1)]);
		});

		it("agrupa los componentes del armado y deja aparte las lineas sueltas", () => {
			renderConProviders(<Carrito />);

			const grupo = screen.getByRole("heading", { name: "Armado personalizado" }).closest("section");
			expect(grupo).toHaveTextContent("Conjunto ARM-X");
			expect(grupo).toHaveTextContent("2 componentes");
			expect(within(grupo).getAllByRole("article")).toHaveLength(2);
			expect(screen.getAllByRole("article")).toHaveLength(3);
		});

		it("quitar el armado elimina solo sus componentes", async () => {
			renderConProviders(<Carrito />);

			await userEvent.click(screen.getByRole("button", { name: "Quitar el armado" }));

			expect(screen.queryByRole("heading", { name: "Armado personalizado" })).not.toBeInTheDocument();
			expect(screen.getAllByRole("article")).toHaveLength(1);
		});
	});
});

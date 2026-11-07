import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import { useCarrito } from "./carrito.js";

// Productos de la semilla: el mouse tiene stock de sobra y la tarjeta grafica solo 2 unidades.
const MOUSE = "PER-MOUSE-RGB";
const TARJETA_GRAFICA = "GPU-RTX4090";

/**
 * Componente de prueba: muestra el estado del carrito y un boton por cada
 * operacion del proveedor, para llamarlas como lo haria una vista.
 */
function PruebaCarrito() {
	const carrito = useCarrito();

	return (
		<div>
			<p data-testid="cantidad">{carrito.cantidad}</p>
			<p data-testid="lineas">{carrito.lineas.length}</p>
			<button onClick={() => carrito.agregar(MOUSE)}>agregar mouse</button>
			<button onClick={() => carrito.agregar(TARJETA_GRAFICA, 3)}>agregar 3 tarjetas</button>
			<button onClick={() => carrito.cambiarCantidad(1, 4)}>cantidad 4</button>
			<button onClick={() => carrito.eliminarLinea(1)}>eliminar linea 1</button>
			<button onClick={() => carrito.agregarArmado([MOUSE, TARJETA_GRAFICA])}>agregar armado</button>
			<button onClick={() => carrito.eliminarArmado(carrito.lineas[0].armado)}>eliminar armado</button>
			<button onClick={() => carrito.vaciar()}>vaciar</button>
		</div>
	);
}

function cantidadEnCarrito() {
	return Number(screen.getByTestId("cantidad").textContent);
}

describe("CarritoProvider", () => {
	beforeEach(limpiarAlmacenamiento);

	afterEach(() => {
		vi.useRealTimers();
	});

	it("parte con el carrito vacio", () => {
		renderConProviders(<PruebaCarrito />);

		expect(cantidadEnCarrito()).toBe(0);
		expect(screen.getByTestId("lineas")).toHaveTextContent("0");
	});

	it("agregar suma una unidad y la guarda en localStorage", async () => {
		renderConProviders(<PruebaCarrito />);

		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

		expect(cantidadEnCarrito()).toBe(1);
		const guardado = JSON.parse(window.localStorage.getItem("carrito"));
		expect(guardado).toHaveLength(1);
		expect(guardado[0].producto).toBe(MOUSE);
	});

	it("agregar el mismo producto dos veces deja una sola linea con dos unidades", async () => {
		renderConProviders(<PruebaCarrito />);

		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));
		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

		expect(screen.getByTestId("lineas")).toHaveTextContent("1");
		expect(cantidadEnCarrito()).toBe(2);
	});

	it("cambiarCantidad modifica las unidades de la linea", async () => {
		renderConProviders(<PruebaCarrito />);
		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

		await userEvent.click(screen.getByRole("button", { name: "cantidad 4" }));

		expect(cantidadEnCarrito()).toBe(4);
	});

	it("eliminarLinea quita la linea del carrito", async () => {
		renderConProviders(<PruebaCarrito />);
		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

		await userEvent.click(screen.getByRole("button", { name: "eliminar linea 1" }));

		expect(cantidadEnCarrito()).toBe(0);
	});

	it("agregarArmado crea una linea por componente y eliminarArmado las quita todas", async () => {
		renderConProviders(<PruebaCarrito />);

		await userEvent.click(screen.getByRole("button", { name: "agregar armado" }));
		expect(screen.getByTestId("lineas")).toHaveTextContent("2");

		await userEvent.click(screen.getByRole("button", { name: "eliminar armado" }));
		expect(screen.getByTestId("lineas")).toHaveTextContent("0");
	});

	it("el identificador del armado sale de la hora actual (reloj simulado)", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2031-05-10T12:00:00"));
		renderConProviders(<PruebaCarrito />);

		// Con el reloj falso, userEvent no puede esperar con temporizadores: se hace clic con fireEvent.
		act(() => screen.getByRole("button", { name: "agregar armado" }).click());

		const guardado = JSON.parse(window.localStorage.getItem("carrito"));
		expect(guardado[0].armado).toBe(`ARM-${new Date("2031-05-10T12:00:00").getTime().toString(36).toUpperCase()}`);
	});

	it("vaciar deja el carrito sin lineas", async () => {
		renderConProviders(<PruebaCarrito />);
		await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

		await userEvent.click(screen.getByRole("button", { name: "vaciar" }));

		expect(cantidadEnCarrito()).toBe(0);
		expect(JSON.parse(window.localStorage.getItem("carrito"))).toEqual([]);
	});

	it("una operacion rechazada por falta de stock no cambia el carrito y lo avisa", async () => {
		renderConProviders(<PruebaCarrito />);

		await userEvent.click(screen.getByRole("button", { name: "agregar 3 tarjetas" }));

		expect(cantidadEnCarrito()).toBe(0);
		expect(screen.getByText(/Solo quedan 2 unidades/)).toBeInTheDocument();
	});

	describe("aviso de confirmacion", () => {
		it("aparece al agregar y se cierra solo a los 3 segundos", () => {
			vi.useFakeTimers();
			renderConProviders(<PruebaCarrito />);

			act(() => screen.getByRole("button", { name: "agregar mouse" }).click());
			expect(screen.getByText(/se agrego al carrito/)).toBeInTheDocument();

			act(() => vi.advanceTimersByTime(2999));
			expect(screen.getByText(/se agrego al carrito/)).toBeInTheDocument();

			act(() => vi.advanceTimersByTime(1));
			expect(screen.queryByText(/se agrego al carrito/)).not.toBeInTheDocument();
		});

		it("se puede cerrar con el boton Cerrar", async () => {
			renderConProviders(<PruebaCarrito />);
			await userEvent.click(screen.getByRole("button", { name: "agregar mouse" }));

			await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

			expect(screen.queryByText(/se agrego al carrito/)).not.toBeInTheDocument();
		});
	});
});

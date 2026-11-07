import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import { useDatos } from "./datos.js";

const productoNuevo = {
	sku: "TST-001",
	nombre: "Producto de prueba",
	descripcion: "",
	precio: 1000,
	stock: 5,
	categoria: "cpu",
};

/**
 * Componente de prueba: muestra cuantos productos hay y tiene un boton que
 * crea un producto. El resultado de crearProducto se entrega a "alResultado".
 */
function PruebaDatos({ sku = productoNuevo.sku, alResultado }) {
	const { productos, crearProducto } = useDatos();

	return (
		<div>
			<p data-testid="total">{productos.length}</p>
			<button onClick={() => alResultado(crearProducto({ ...productoNuevo, sku }))}>crear producto</button>
		</div>
	);
}

describe("DatosProvider", () => {
	beforeEach(limpiarAlmacenamiento);

	it("entrega los productos de la semilla", () => {
		renderConProviders(<PruebaDatos alResultado={vi.fn()} />);

		expect(Number(screen.getByTestId("total").textContent)).toBeGreaterThan(0);
	});

	it("crear un producto valido actualiza la lista sin recargar la pagina", async () => {
		const alResultado = vi.fn();
		renderConProviders(<PruebaDatos alResultado={alResultado} />);
		const antes = Number(screen.getByTestId("total").textContent);

		await userEvent.click(screen.getByRole("button", { name: "crear producto" }));

		expect(Number(screen.getByTestId("total").textContent)).toBe(antes + 1);
		expect(alResultado).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
	});

	it("crear un producto con un SKU repetido no cambia la lista y devuelve el error", async () => {
		const alResultado = vi.fn();
		// CPU-R5-7600 ya existe en la semilla.
		renderConProviders(<PruebaDatos sku="CPU-R5-7600" alResultado={alResultado} />);
		const antes = Number(screen.getByTestId("total").textContent);

		await userEvent.click(screen.getByRole("button", { name: "crear producto" }));

		expect(Number(screen.getByTestId("total").textContent)).toBe(antes);
		expect(alResultado).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
	});
});

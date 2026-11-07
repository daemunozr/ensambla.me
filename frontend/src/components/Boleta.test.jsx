import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { itemsDeOrden, orden, subtotalOrden, totalOrden } from "../data/datos.js";
import { desgloseIva } from "../logic/ordenes.js";
import { precio } from "../utils/formato.js";
import { limpiarAlmacenamiento } from "../testUtils.jsx";
import Boleta from "./Boleta.jsx";

const montar = (numero, cambios = {}) =>
	render(<Boleta orden={{ ...orden(numero), ...cambios }} items={itemsDeOrden(numero)} />);

describe("Boleta", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el numero, la fecha y que es un comprobante simulado (RF-22 CA3)", () => {
		montar("ORD-2026-0001");

		expect(screen.getByRole("heading", { name: "Boleta ORD-2026-0001" })).toBeInTheDocument();
		expect(screen.getByText("12-09-2026")).toBeInTheDocument();
		expect(screen.getByText("Comprobante simulado, sin validez tributaria.")).toBeInTheDocument();
	});

	it("lista una fila por producto con cantidad, precio unitario y subtotal", () => {
		montar("ORD-2026-0001");

		const filas = within(screen.getByRole("table")).getAllByRole("row");
		// Encabezado + 3 productos + 3 filas del pie (subtotal, envio, total).
		expect(filas).toHaveLength(1 + 3 + 3);
		const ram = screen.getByText("RAM-DDR5-16-5600").closest("tr");
		expect(within(ram).getByText("2")).toBeInTheDocument();
		expect(within(ram).getByText(precio(72990))).toBeInTheDocument();
		expect(within(ram).getByText(precio(2 * 72990))).toBeInTheDocument();
	});

	it("el total incluye el envio y desglosa el neto y el IVA del 19 %", () => {
		montar("ORD-2026-0005");
		const total = totalOrden("ORD-2026-0005");
		const { neto, iva } = desgloseIva(total);

		expect(subtotalOrden("ORD-2026-0005")).toBeLessThan(total);
		expect(screen.getByText(precio(4990))).toBeInTheDocument();
		expect(screen.getAllByText(precio(total)).length).toBeGreaterThan(0);
		expect(screen.getByText(`El total incluye IVA: neto ${precio(neto)} + IVA (19%) ${precio(iva)}.`)).toBeInTheDocument();
	});

	it("un envio de costo 0 se muestra como «Gratis»", () => {
		montar("ORD-2026-0001");

		expect(screen.getByText("Gratis")).toBeInTheDocument();
	});

	it("con despacho muestra la direccion y la comuna; con retiro en tienda, no", () => {
		const { unmount } = montar("ORD-2026-0001");
		expect(screen.getByText("Despacho a domicilio")).toBeInTheDocument();
		expect(screen.getByText(/Irarrazaval 2550, Nunoa/)).toBeInTheDocument();
		unmount();

		montar("ORD-2026-0003");
		expect(screen.queryByText(/Alameda 1449/)).not.toBeInTheDocument();
	});

	it("identifica al comprador por RUN o como invitado", () => {
		const { unmount } = montar("ORD-2026-0001");
		expect(screen.getByText(/RUN 123456785/)).toBeInTheDocument();
		unmount();

		montar("ORD-2026-0007");
		expect(screen.getByText(/Invitado \(sin cuenta\)/)).toBeInTheDocument();
	});

	it("muestra el medio de pago, o una raya si no hubo", () => {
		const { unmount } = montar("ORD-2026-0001");
		expect(screen.getByText("Tarjeta terminada en 4242")).toBeInTheDocument();
		unmount();

		montar("ORD-2026-0001", { medioPago: "" });
		expect(screen.queryByText("Tarjeta terminada en 4242")).not.toBeInTheDocument();
	});

	it("un producto que ya no esta en el catalogo conserva su linea (RF-22 CA4)", () => {
		render(
			<Boleta
				orden={orden("ORD-2026-0001")}
				items={[{ orden: "ORD-2026-0001", producto: "SKU-RETIRADO", cantidad: 1, precioUnitario: 1000 }]}
			/>,
		);

		expect(screen.getByText("SKU-RETIRADO")).toBeInTheDocument();
		expect(screen.getByText("Producto fuera del catalogo")).toBeInTheDocument();
	});

	it("«Imprimir boleta» abre el dialogo de impresion", async () => {
		const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
		montar("ORD-2026-0001");

		await userEvent.click(screen.getByRole("button", { name: "Imprimir boleta" }));

		expect(imprimir).toHaveBeenCalledOnce();
		imprimir.mockRestore();
	});
});

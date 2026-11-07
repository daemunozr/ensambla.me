import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ordenes } from "../data/datos.js";
import { limpiarAlmacenamiento } from "../testUtils.jsx";
import TablaOrdenes from "./TablaOrdenes.jsx";

const ruta = (numero) => `/ordenes/${numero}`;
const montar = (props) =>
	render(
		<MemoryRouter>
			<TablaOrdenes ordenes={ordenes()} rutaDetalle={ruta} {...props} />
		</MemoryRouter>,
	);

describe("TablaOrdenes", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista las ordenes de la mas reciente a la mas antigua", () => {
		montar();

		const numeros = screen.getAllByRole("row").slice(1).map((fila) => within(fila).getAllByRole("cell")[0].textContent);
		expect(numeros).toEqual([...numeros].sort().reverse());
		expect(numeros[0]).toBe("ORD-2026-0007");
	});

	it("cada fila enlaza a su boleta con la ruta que entrega rutaDetalle", () => {
		montar();

		const enlace = screen.getAllByRole("link", { name: "Ver boleta" })[0];
		expect(enlace).toHaveAttribute("href", "/ordenes/ORD-2026-0007");
	});

	it("muestra los productos de la orden con su cantidad", () => {
		montar({ ordenes: ordenes().filter((o) => o.numero === "ORD-2026-0001") });

		expect(screen.getByText(/Kingston Fury Beast DDR5 16 GB/)).toHaveTextContent("(x2)");
	});

	it("sin conCliente no hay columna de cliente", () => {
		montar();

		expect(screen.queryByRole("columnheader", { name: "Cliente" })).not.toBeInTheDocument();
	});

	it("con conCliente muestra el nombre y el RUN, o «Invitado»", () => {
		montar({ conCliente: true });

		expect(screen.getByRole("columnheader", { name: "Cliente" })).toBeInTheDocument();
		const invitada = screen.getByText("ORD-2026-0007").closest("tr");
		expect(invitada).toHaveTextContent("Sofia Contreras Pino");
		expect(invitada).toHaveTextContent("Invitado");
		const camila = screen.getByText("ORD-2026-0001").closest("tr");
		expect(camila).toHaveTextContent("123456785");
	});

	it("sin ordenes muestra el mensaje vacio, personalizable", () => {
		const { unmount } = montar({ ordenes: [] });
		expect(screen.getByText("No hay ordenes registradas.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		unmount();

		montar({ ordenes: [], mensajeVacio: "Nada por aqui." });
		expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
	});

	it("el titulo es la leyenda accesible de la tabla", () => {
		montar({ titulo: "Tus compras" });

		expect(screen.getByRole("table", { name: "Tus compras" })).toBeInTheDocument();
	});
});

import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { producto, productos } from "../../data/datos.js";
import { productosCriticos } from "../../logic/stock.js";
import { SESION_ADMIN, SESION_LOGISTICA, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Criticos from "./Criticos.jsx";

function montar(sesion = SESION_ADMIN) {
	return renderConProviders(
		<Routes>
			<Route path="/admin/productos/criticos" element={<Criticos />} />
		</Routes>,
		{ ruta: "/admin/productos/criticos", sesion },
	);
}
const skus = () => screen.queryAllByRole("row").slice(1).map((f) => within(f).getByRole("code").textContent);
const sembrar = (cambios) =>
	window.sessionStorage.setItem(
		"productos",
		JSON.stringify(productos().map((p) => ({ ...p, stock: 50, stockCritico: 5, ...cambios[p.sku] }))),
	);

describe("admin / Criticos", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista los productos con stock igual o inferior a su umbral (RF-26 CA1)", () => {
		montar();

		const esperados = productosCriticos(productos()).map((p) => p.sku);
		expect(esperados.length).toBeGreaterThan(0);
		expect(skus()).toEqual(esperados);
	});

	it("ordena primero los agotados, luego el mayor faltante y, a igualdad, por codigo (RF-26 CA1)", () => {
		sembrar({
			"CPU-R5-7600": { stock: 1, stockCritico: 5 }, // falta 4
			"CPU-R7-7800X3D": { stock: 3, stockCritico: 5 }, // falta 2
			"GPU-RTX4060": { stock: 0, stockCritico: 2 }, // agotado, falta 2
			"MB-B650-PG": { stock: 0, stockCritico: 6 }, // agotado, falta 6
			"PER-MOUSE-RGB": { stock: 3, stockCritico: 5 }, // falta 2, SKU posterior
		});
		montar();

		expect(skus()).toEqual(["MB-B650-PG", "GPU-RTX4060", "CPU-R5-7600", "CPU-R7-7800X3D", "PER-MOUSE-RGB"]);
	});

	it("cada fila muestra stock, umbral, unidades que faltan y estado (RF-26 CA2)", () => {
		sembrar({ "CPU-R5-7600": { stock: 1, stockCritico: 5 }, "GPU-RTX4060": { stock: 0, stockCritico: 2 } });
		montar();

		const cpu = screen.getByText("CPU-R5-7600").closest("tr");
		const celdas = within(cpu).getAllByRole("cell").map((c) => c.textContent);
		expect(celdas.slice(4, 8)).toEqual(["1", "5", "4", "Stock critico"]);
		const gpu = screen.getByText("GPU-RTX4060").closest("tr");
		expect(gpu).toHaveTextContent("Sin stock");
	});

	it("resume la cantidad de productos criticos, en singular o plural", () => {
		sembrar({ "CPU-R5-7600": { stock: 1, stockCritico: 5 } });
		const { unmount } = montar();
		expect(screen.getByText("1 producto con stock bajo o igual a su umbral.")).toBeInTheDocument();
		unmount();

		sembrar({ "CPU-R5-7600": { stock: 1 }, "GPU-RTX4060": { stock: 1 } });
		montar();
		expect(screen.getByText("2 productos con stock bajo o igual a su umbral.")).toBeInTheDocument();
	});

	it("el administrador accede desde cada fila a la ficha del producto para reponer (RF-26 CA3)", () => {
		montar(SESION_ADMIN);

		expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
		const primero = skus()[0];
		const fila = screen.getByText(primero).closest("tr");
		expect(within(fila).getByRole("link", { name: "Editar" })).toHaveAttribute("href", `/admin/productos/${primero}/editar`);
	});

	it("el logistico lo ve en solo lectura, sin acciones de edicion (RF-26 CA3)", () => {
		montar(SESION_LOGISTICA);

		expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
		expect(skus().length).toBeGreaterThan(0);
	});

	it("el nombre del producto enlaza a su detalle en la tienda", () => {
		montar();
		const primero = producto(skus()[0]);

		expect(screen.getByRole("link", { name: primero.nombre })).toHaveAttribute("href", `/productos/${primero.sku}`);
	});

	it("sin productos criticos lo indica y no muestra la tabla (RF-26 CA4)", () => {
		sembrar({});
		montar();

		expect(screen.getByText("Ningun producto esta en stock critico.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		expect(screen.getByText("0 productos con stock bajo o igual a su umbral.")).toBeInTheDocument();
	});

	it("un producto sin umbral no se considera critico", () => {
		sembrar({ "CPU-R5-7600": { stock: 0, stockCritico: "" } });
		montar();

		expect(screen.queryByText("CPU-R5-7600")).not.toBeInTheDocument();
	});

	it("ofrece volver a productos", () => {
		montar();

		expect(screen.getByRole("link", { name: "Volver a productos" })).toHaveAttribute("href", "/admin/productos");
	});
});

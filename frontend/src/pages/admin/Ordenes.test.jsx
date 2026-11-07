import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { ordenes } from "../../data/datos.js";
import { SESION_ADMIN, SESION_LOGISTICA, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import OrdenesAdmin from "./Ordenes.jsx";

function montar(sesion = SESION_ADMIN) {
	return renderConProviders(
		<Routes>
			<Route path="/admin/ordenes" element={<OrdenesAdmin />} />
		</Routes>,
		{ ruta: "/admin/ordenes", sesion },
	);
}
const numeros = () => screen.queryAllByRole("row").slice(1).map((f) => within(f).getAllByRole("cell")[0].textContent);

describe("admin / Ordenes", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista todas las ordenes con cliente, fecha, productos y total, de la mas reciente a la mas antigua (RF-12 CA2)", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Ordenes" })).toBeInTheDocument();
		expect(numeros()).toHaveLength(ordenes().length);
		expect(numeros()[0]).toBe("ORD-2026-0007");
		["Orden", "Cliente", "Fecha", "Productos", "Total"].forEach((c) =>
			expect(screen.getByRole("columnheader", { name: c })).toBeInTheDocument(),
		);
	});

	it("es de solo lectura: solo enlaza a la boleta de cada orden", () => {
		montar(SESION_LOGISTICA);

		expect(screen.getByText(/Vista de solo lectura/)).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.getAllByRole("link", { name: "Ver boleta" })[0]).toHaveAttribute("href", "/admin/ordenes/ORD-2026-0007");
	});

	it("busca por numero", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "0003");

		expect(numeros()).toEqual(["ORD-2026-0003"]);
		expect(screen.getByText(`Mostrando 1 de ${ordenes().length}.`)).toBeInTheDocument();
	});

	it("busca por cliente (nombre o RUN) y por correo", async () => {
		montar();
		const buscar = screen.getByLabelText("Buscar");

		await userEvent.type(buscar, "camila");
		expect(numeros()).toEqual(["ORD-2026-0004", "ORD-2026-0001"]);

		await userEvent.clear(buscar);
		await userEvent.type(buscar, "sofia.contreras@gmail.com");
		expect(numeros()).toEqual(["ORD-2026-0007"]);

		await userEvent.clear(buscar);
		await userEvent.type(buscar, "98765433");
		expect(numeros()).toEqual(["ORD-2026-0006", "ORD-2026-0003"]);
	});

	it("busca por producto (codigo o nombre)", async () => {
		montar();
		const buscar = screen.getByLabelText("Buscar");

		await userEvent.type(buscar, "GPU-RTX4060");
		expect(numeros()).toEqual(["ORD-2026-0007", "ORD-2026-0002"]);

		await userEvent.clear(buscar);
		await userEvent.type(buscar, "monitor");
		expect(numeros()).toEqual(["ORD-2026-0003"]);
	});

	it("una busqueda sin resultados lo indica", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "zzzzzz");

		expect(screen.getByText("Ninguna orden coincide con la busqueda.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("sin ordenes muestra que no hay registradas", () => {
		window.sessionStorage.setItem("ordenes", "[]");
		montar();

		expect(screen.getByText("No hay ordenes registradas.")).toBeInTheDocument();
	});
});

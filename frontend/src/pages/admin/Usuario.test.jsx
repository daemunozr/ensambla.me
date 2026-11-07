import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { ordenesDe, totalOrden, usuario, usuarios } from "../../data/datos.js";
import { precio } from "../../utils/formato.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../../testUtils.jsx";
import UsuarioFicha from "./Usuario.jsx";

function montar(run) {
	return renderConProviders(
		<Routes>
			<Route path="/admin/usuarios/:run" element={<UsuarioFicha />} />
		</Routes>,
		{ ruta: `/admin/usuarios/${run}`, sesion: sesionDe(usuario("190110222")) },
	);
}

describe("admin / Usuario (ficha)", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra los datos del usuario sin su contrasena (RF-11 CA5)", () => {
		montar("123456785");

		expect(screen.getByRole("heading", { level: 1, name: "Camila Soto Vera" })).toBeInTheDocument();
		const datos = screen.getByRole("heading", { name: "Datos del usuario" }).closest("section");
		expect(datos).toHaveTextContent("123456785");
		expect(datos).toHaveTextContent("camila@gmail.com");
		expect(datos).toHaveTextContent("Cliente");
		expect(datos).toHaveTextContent("Irarrazaval 2550");
		expect(document.body).not.toHaveTextContent("cliente123");
	});

	it("ofrece editar y volver al listado", () => {
		montar("123456785");

		expect(screen.getByRole("link", { name: "Editar usuario" })).toHaveAttribute("href", "/admin/usuarios/123456785/editar");
		expect(screen.getByRole("link", { name: "Volver al listado" })).toHaveAttribute("href", "/admin/usuarios");
	});

	it("resume el historial de compras y enlaza a cada boleta (RF-11 CA5)", () => {
		montar("123456785");
		const gasto = ordenesDe("123456785").reduce((suma, o) => suma + totalOrden(o.numero), 0);

		expect(screen.getByText(`2 compras por un total de ${precio(gasto)}.`)).toBeInTheDocument();
		const tabla = screen.getByRole("table");
		const enlaces = within(tabla).getAllByRole("link", { name: "Ver boleta" });
		expect(enlaces.map((a) => a.getAttribute("href"))).toEqual(["/admin/ordenes/ORD-2026-0004", "/admin/ordenes/ORD-2026-0001"]);
	});

	it("un usuario sin compras lo indica y no muestra la tabla", () => {
		montar("190110222");

		expect(screen.getByText("Este usuario todavia no tiene compras.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("sin fecha de nacimiento muestra una raya", () => {
		window.sessionStorage.setItem("usuarios", JSON.stringify(usuarios().map((u) => (u.run === "123456785" ? { ...u, fechaNacimiento: "" } : u))));
		montar("123456785");

		expect(screen.getByText("Nacimiento").nextElementSibling).toHaveTextContent("—");
	});

	it("un RUN que no existe muestra «Usuario no encontrado»", () => {
		montar("999999999");

		expect(screen.getByRole("heading", { level: 1, name: "Usuario no encontrado" })).toBeInTheDocument();
		expect(screen.getByText("999999999")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver a los usuarios" })).toHaveAttribute("href", "/admin/usuarios");
	});
});

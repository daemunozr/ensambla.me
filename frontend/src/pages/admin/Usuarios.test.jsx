import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { usuario, usuarios } from "../../data/datos.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders, sesionDe } from "../../testUtils.jsx";
import UsuariosAdmin from "./Usuarios.jsx";

const ADMIN = () => sesionDe(usuario("190110222"));

function montar(sesion = ADMIN(), ruta = "/admin/usuarios") {
	return renderConProviders(
		<Routes>
			<Route path="/admin/usuarios" element={<UsuariosAdmin />} />
		</Routes>,
		{ ruta, sesion },
	);
}
const filaDe = (run) => screen.getByText(run).closest("tr");

describe("admin / Usuarios", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista todos los usuarios con su tipo y comuna (RF-11 CA1)", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument();
		expect(screen.getAllByRole("row")).toHaveLength(usuarios().length + 1);
		expect(filaDe("123456785")).toHaveTextContent("Camila Soto Vera");
		expect(filaDe("123456785")).toHaveTextContent("Cliente");
		expect(filaDe("152345674")).toHaveTextContent("Administrador logistico");
	});

	it("ofrece crear, ver, editar y eliminar", () => {
		montar();

		expect(screen.getByRole("link", { name: "Nuevo usuario" })).toHaveAttribute("href", "/admin/usuarios/nuevo");
		const fila = filaDe("123456785");
		expect(within(fila).getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/admin/usuarios/123456785");
		expect(within(fila).getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/admin/usuarios/123456785/editar");
		expect(within(fila).getByRole("button", { name: "Eliminar" })).toBeEnabled();
	});

	it("marca la cuenta de la sesion y no deja eliminarla", () => {
		montar();

		const propia = filaDe("190110222");
		expect(propia).toHaveTextContent("Tu cuenta");
		expect(within(propia).getByRole("button", { name: "Eliminar" })).toBeDisabled();
	});

	it("la busqueda filtra por nombre, correo, tipo o comuna y actualiza el conteo", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "matias");

		expect(screen.getAllByRole("row")).toHaveLength(2);
		expect(screen.getByText(`Mostrando 1 de ${usuarios().length}.`)).toBeInTheDocument();
	});

	it("una busqueda sin resultados muestra el estado vacio", async () => {
		montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "zzzzzz");

		expect(screen.getByText("Ningun usuario coincide con la busqueda.")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("avisa del usuario recien guardado que viene en la URL", () => {
		montar(ADMIN(), "/admin/usuarios?guardado=123456785");

		expect(screen.getByRole("alert")).toHaveTextContent("El usuario con RUN 123456785 se guardo correctamente.");
	});

	describe("eliminar (RF-11 CA6)", () => {
		it("pide confirmacion con el nombre y el RUN, y cancelar no elimina", async () => {
			montar();

			await userEvent.click(within(filaDe("98765433")).getByRole("button", { name: "Eliminar" }));
			const dialogo = screen.getByRole("dialog", { name: "Eliminar usuario" });
			expect(dialogo).toHaveTextContent("Patricia Alvarez Diaz");
			expect(dialogo).toHaveTextContent("RUN 98765433");

			await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(usuario("98765433")).toBeDefined();
		});

		it("confirmar elimina a un usuario sin ordenes y quita su fila", async () => {
			window.sessionStorage.setItem("ordenes", "[]");
			montar();

			await userEvent.click(within(filaDe("98765433")).getByRole("button", { name: "Eliminar" }));
			await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

			expect(usuario("98765433")).toBeUndefined();
			expect(screen.queryByText("98765433")).not.toBeInTheDocument();
			expect(screen.getByRole("alert")).toHaveTextContent("98765433");
		});

		it("un usuario con ordenes a su nombre se rechaza y sigue en el listado", async () => {
			montar();

			await userEvent.click(within(filaDe("123456785")).getByRole("button", { name: "Eliminar" }));
			await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

			expect(usuario("123456785")).toBeDefined();
			expect(screen.getByRole("alert")).toHaveClass("alert-danger");
			expect(filaDe("123456785")).toBeInTheDocument();
		});
	});

	it("sin usuarios muestra que no hay cargados", () => {
		window.sessionStorage.setItem("usuarios", "[]");
		montar(SESION_ADMIN);

		expect(screen.getByText("No hay usuarios cargados.")).toBeInTheDocument();
	});
});

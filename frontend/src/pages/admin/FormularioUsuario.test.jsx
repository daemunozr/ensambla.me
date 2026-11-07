import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { usuario, usuarios } from "../../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../../testUtils.jsx";
import FormularioUsuario from "./FormularioUsuario.jsx";

function Ubicacion() {
	const { pathname, search } = useLocation();
	return <p data-testid="ubicacion">{pathname + search}</p>;
}

function montar(ruta = "/admin/usuarios/nuevo") {
	return renderConProviders(
		<>
			<Routes>
				<Route path="/admin/usuarios/nuevo" element={<FormularioUsuario />} />
				<Route path="/admin/usuarios/:run/editar" element={<FormularioUsuario />} />
				<Route path="/admin/usuarios" element={<p>Listado</p>} />
			</Routes>
			<Ubicacion />
		</>,
		{ ruta, sesion: sesionDe(usuario("190110222")) },
	);
}

const campo = (etiqueta) => screen.getByLabelText(new RegExp(`^${etiqueta}`));
const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar usuario" }));

async function llenarValido(cambios = {}) {
	const v = { run: "111111111", nombre: "Ana", apellidos: "Pinto Diaz", correo: "ana@gmail.com", contrasena: "ana1234", ...cambios };
	await userEvent.type(campo("RUN"), v.run);
	await userEvent.type(campo("Nombre"), v.nombre);
	await userEvent.type(campo("Apellidos"), v.apellidos);
	await userEvent.type(campo("Correo"), v.correo);
	await userEvent.type(campo("Contrasena"), v.contrasena);
	await userEvent.selectOptions(campo("Tipo de usuario"), "CLIENTE");
	await userEvent.selectOptions(campo("Region"), "RM");
	await userEvent.selectOptions(campo("Comuna"), "RM-01");
	await userEvent.type(campo("Direccion"), "Calle 123");
}

describe("admin / FormularioUsuario", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("crear", () => {
		it("muestra el formulario vacio con el tipo de usuario como campo obligatorio (RF-11 CA3)", () => {
			montar();

			expect(screen.getByRole("heading", { level: 1, name: "Nuevo usuario" })).toBeInTheDocument();
			expect(campo("RUN")).toHaveValue("");
			expect(campo("Tipo de usuario")).toBeRequired();
			expect(campo("Fecha de nacimiento")).not.toBeRequired();
		});

		it("el select de tipo ofrece exactamente los tres roles (RF-11 CA3)", () => {
			montar();

			const opciones = [...campo("Tipo de usuario").querySelectorAll("option")].map((o) => o.textContent);
			expect(opciones).toEqual(["Selecciona un tipo", "Administrador", "Cliente", "Administrador logistico"]);
		});

		it("enviar vacio marca los campos obligatorios y no crea el usuario (RF-11 CA2)", async () => {
			montar();
			const antes = usuarios().length;

			await guardar();

			expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(5);
			expect(screen.getByText("Selecciona el tipo de usuario.")).toBeInTheDocument();
			expect(usuarios()).toHaveLength(antes);
		});

		it("aplica las reglas del registro: RUN, correo y contrasena (RF-11 CA2)", async () => {
			montar();

			await userEvent.type(campo("RUN"), "123456784");
			await userEvent.type(campo("Correo"), "ana@hotmail.com");
			await userEvent.type(campo("Contrasena"), "abc");

			expect(screen.getByText(/^RUN invalido/)).toBeInTheDocument();
			expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
			expect(screen.getByText("La contrasena debe tener entre 4 y 10 caracteres.")).toBeInTheDocument();
		});

		it("con datos validos crea el usuario y vuelve al listado con el aviso (RF-11 CA1 y CA4)", async () => {
			montar();
			await llenarValido();

			await guardar();

			expect(usuario("111111111")).toMatchObject({ nombre: "Ana", tipoUsuario: "CLIENTE", comuna: "RM-01" });
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/usuarios?guardado=111111111");
		});

		it("un RUN que ya existe se rechaza y se queda en el formulario", async () => {
			montar();
			await llenarValido({ run: "190110222", correo: "otro@gmail.com" });

			await guardar();

			expect(screen.getByRole("alert")).toHaveTextContent("Ya existe un usuario con RUN 190110222.");
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/usuarios/nuevo");
		});

		it("un correo que usa otro usuario se rechaza", async () => {
			montar();
			await llenarValido({ correo: "camila@gmail.com" });

			await guardar();

			expect(screen.getByRole("alert")).toHaveTextContent("ya esta usado por otro usuario");
			expect(usuario("111111111")).toBeUndefined();
		});

		it("al cambiar la region se recargan las comunas", async () => {
			montar();

			await userEvent.selectOptions(campo("Region"), "BI");

			expect(campo("Comuna").querySelector("option[value='RM-01']")).toBeNull();
			expect(campo("Comuna").querySelector("option[value='BI-01']")).not.toBeNull();
		});
	});

	describe("editar", () => {
		it("parte con los datos del usuario y no deja cambiar el RUN", () => {
			montar("/admin/usuarios/123456785/editar");

			expect(screen.getByRole("heading", { level: 1, name: "Editar Camila Soto Vera" })).toBeInTheDocument();
			expect(campo("RUN")).toHaveValue("123456785");
			expect(campo("RUN")).toHaveAttribute("readonly");
			expect(campo("Region")).toHaveValue("RM");
			expect(campo("Comuna")).toHaveValue("RM-04");
			expect(campo("Tipo de usuario")).toHaveValue("CLIENTE");
		});

		it("guardar refleja los cambios en el usuario (RF-11 CA1)", async () => {
			montar("/admin/usuarios/123456785/editar");

			await userEvent.selectOptions(campo("Tipo de usuario"), "LOGISTICA");
			const nombre = campo("Nombre");
			await userEvent.clear(nombre);
			await userEvent.type(nombre, "Camila Paz");
			await guardar();

			expect(usuario("123456785")).toMatchObject({ nombre: "Camila Paz", tipoUsuario: "LOGISTICA" });
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/usuarios?guardado=123456785");
		});

		it("un correo de otro usuario se rechaza al editar", async () => {
			montar("/admin/usuarios/123456785/editar");
			const correo = campo("Correo");

			await userEvent.clear(correo);
			await userEvent.type(correo, "matias@gmail.com");
			await guardar();

			expect(screen.getByRole("alert")).toHaveTextContent("ya esta usado por otro usuario");
			expect(usuario("123456785").correo).toBe("camila@gmail.com");
		});

		it("un RUN que no existe avisa al abrir", () => {
			montar("/admin/usuarios/999999999/editar");

			expect(screen.getByRole("alert")).toHaveTextContent("No existe un usuario con RUN 999999999.");
		});
	});

	it("«Volver al listado» regresa sin guardar", async () => {
		montar();

		await userEvent.click(screen.getByRole("link", { name: "Volver al listado" }));

		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/usuarios");
	});
});

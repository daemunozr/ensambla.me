import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuario, usuarios } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Registro from "./Registro.jsx";

describe("Registro", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el formulario con sus campos obligatorios", () => {
		renderConProviders(<Registro />);

		expect(screen.getByRole("heading", { level: 1, name: "Registro de cliente" })).toBeInTheDocument();
		["RUN", "Nombre", "Apellidos", "Correo", "Contrasena", "Direccion"].forEach((etiqueta) =>
			expect(screen.getByLabelText(new RegExp(`^${etiqueta}`))).toBeRequired(),
		);
		expect(screen.getByLabelText(/^Fecha de nacimiento/)).not.toBeRequired();
	});

	it("enviar vacio muestra un error por cada campo obligatorio y no crea el usuario", async () => {
		renderConProviders(<Registro />);
		const antes = usuarios().length;

		await userEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

		expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(5);
		expect(usuarios()).toHaveLength(antes);
	});

	it("un RUN con el digito verificador incorrecto muestra el error al escribir", async () => {
		renderConProviders(<Registro />);

		await userEvent.type(screen.getByLabelText(/^RUN/), "123456784");

		expect(screen.getByText(/^RUN invalido/)).toBeInTheDocument();
		expect(screen.getByLabelText(/^RUN/)).toHaveClass("is-invalid");
	});

	it("un RUN correcto queda marcado como valido", async () => {
		renderConProviders(<Registro />);

		await userEvent.type(screen.getByLabelText(/^RUN/), "123456785");

		expect(screen.getByLabelText(/^RUN/)).toHaveClass("is-valid");
	});

	it("rechaza un correo de un dominio no permitido", async () => {
		renderConProviders(<Registro />);

		await userEvent.type(screen.getByLabelText(/^Correo/), "ana@hotmail.com");

		expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
	});

	it("rechaza una contrasena fuera de 4 a 10 caracteres", async () => {
		renderConProviders(<Registro />);

		await userEvent.type(screen.getByLabelText(/^Contrasena/), "abc");

		expect(screen.getByText("La contrasena debe tener entre 4 y 10 caracteres.")).toBeInTheDocument();
	});
	describe("envio", () => {
		const campo = (etiqueta) => screen.getByLabelText(new RegExp(`^${etiqueta}`));

		async function llenar({ run = "111111111", correo = "ana@gmail.com" } = {}) {
			await userEvent.type(campo("RUN"), run);
			await userEvent.type(campo("Nombre"), "Ana");
			await userEvent.type(campo("Apellidos"), "Pinto Diaz");
			await userEvent.type(campo("Correo"), correo);
			await userEvent.type(campo("Contrasena"), "ana1234");
			await userEvent.selectOptions(campo("Region"), "RM");
			await userEvent.selectOptions(campo("Comuna"), "RM-01");
			await userEvent.type(campo("Direccion"), "Calle 123");
		}

		it("un formulario valido crea al usuario como Cliente y confirma con el enlace al inicio de sesion (RF-01 CA7)", async () => {
			renderConProviders(<Registro />);
			await llenar();

			await userEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

			expect(usuario("111111111")).toMatchObject({ nombre: "Ana", tipoUsuario: "CLIENTE", correo: "ana@gmail.com" });
			expect(screen.getByRole("alert")).toHaveTextContent("Cuenta creada para Ana Pinto Diaz. Ya puedes iniciar sesion con ana@gmail.com.");
			expect(screen.getByRole("link", { name: "iniciar sesion" })).toHaveAttribute("href", "/login");
		});

		it("tras crear la cuenta el formulario queda limpio", async () => {
			renderConProviders(<Registro />);
			await llenar();

			await userEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

			expect(campo("RUN")).toHaveValue("");
			expect(campo("Nombre")).toHaveValue("");
		});

		it("un RUN ya registrado se rechaza y no se crea otro usuario (RF-01 CA7)", async () => {
			renderConProviders(<Registro />);
			const antes = usuarios().length;
			await llenar({ run: "123456785", correo: "otra@gmail.com" });

			await userEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

			expect(screen.getByRole("alert")).toHaveClass("alert-danger");
			expect(screen.getByRole("alert")).toHaveTextContent("Ya existe un usuario con RUN 123456785.");
			expect(usuarios()).toHaveLength(antes);
		});

		it("un correo ya registrado se rechaza (RF-01 CA7)", async () => {
			renderConProviders(<Registro />);
			await llenar({ correo: "camila@gmail.com" });

			await userEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

			expect(screen.getByRole("alert")).toHaveTextContent("ya esta usado por otro usuario");
			expect(usuario("111111111")).toBeUndefined();
		});
	});
});

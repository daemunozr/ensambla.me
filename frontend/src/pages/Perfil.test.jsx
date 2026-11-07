import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuario } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import Perfil from "./Perfil.jsx";

const CAMILA = "123456785";
const montar = (props = {}, run = CAMILA) => renderConProviders(<Perfil {...props} />, { sesion: sesionDe(usuario(run)) });
const sesionGuardada = () => JSON.parse(window.sessionStorage.getItem("sesion"));

describe("Perfil", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el RUN y el tipo de usuario como datos de solo lectura (RF-23 CA1)", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeInTheDocument();
		expect(screen.getByText("123456785")).toBeInTheDocument();
		expect(screen.getByText("Cliente")).toBeInTheDocument();
		expect(screen.queryByLabelText(/^RUN/)).not.toBeInTheDocument();
	});

	it("el formulario parte con los datos de la cuenta", () => {
		montar();

		expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Camila");
		expect(screen.getByLabelText(/^Apellidos/)).toHaveValue("Soto Vera");
		expect(screen.getByLabelText(/^Correo/)).toHaveValue("camila@gmail.com");
		expect(screen.getByLabelText(/^Direccion/)).toHaveValue("Irarrazaval 2550, Nunoa");
	});

	it("guardar actualiza la cuenta y la sesion, y la contrasena no cambia (RF-23 CA2 y CA3)", async () => {
		montar();
		const nombre = screen.getByLabelText(/^Nombre/);

		await userEvent.clear(nombre);
		await userEvent.type(nombre, "Camila Andrea");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText("Tus datos se guardaron correctamente.")).toBeInTheDocument();
		expect(usuario(CAMILA)).toMatchObject({ nombre: "Camila Andrea", contrasena: "cliente123", tipoUsuario: "CLIENTE" });
		expect(sesionGuardada().nombre).toBe("Camila Andrea");
	});

	it("un dato invalido muestra su error y no guarda", async () => {
		montar();
		const correo = screen.getByLabelText(/^Correo/);

		await userEvent.clear(correo);
		await userEvent.type(correo, "camila@hotmail.com");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
		expect(screen.queryByText("Tus datos se guardaron correctamente.")).not.toBeInTheDocument();
		expect(usuario(CAMILA).correo).toBe("camila@gmail.com");
	});

	it("un campo obligatorio vacio impide guardar", async () => {
		montar();

		await userEvent.clear(screen.getByLabelText(/^Direccion/));
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText("Este campo es obligatorio.")).toBeInTheDocument();
		expect(usuario(CAMILA).direccion).toBe("Irarrazaval 2550, Nunoa");
	});

	it("un correo que usa otra cuenta se rechaza (RF-23 CA2)", async () => {
		montar();
		const correo = screen.getByLabelText(/^Correo/);

		await userEvent.clear(correo);
		await userEvent.type(correo, "matias@gmail.com");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByRole("alert")).toHaveTextContent("ya esta usado por otro usuario");
		expect(usuario(CAMILA).correo).toBe("camila@gmail.com");
	});

	it("cambiar la region recarga las comunas y exige escoger una", async () => {
		montar();

		await userEvent.selectOptions(screen.getByLabelText(/^Region/), "BI");

		expect(screen.getByLabelText(/^Comuna/)).toHaveValue("");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));
		expect(screen.getByText("Selecciona tu comuna.")).toBeInTheDocument();
	});

	describe("cambio de contrasena", () => {
		const llenar = async (actual, nueva, repetir) => {
			await userEvent.type(screen.getByLabelText(/^Contrasena actual/), actual);
			await userEvent.type(screen.getByLabelText(/^Contrasena nueva/), nueva);
			await userEvent.type(screen.getByLabelText(/^Repite la contrasena nueva/), repetir);
			await userEvent.click(screen.getByRole("button", { name: "Cambiar contrasena" }));
		};

		it("los tres campos son de tipo password (RNF-02 CA3)", () => {
			montar();

			["Contrasena actual", "Contrasena nueva", "Repite la contrasena nueva"].forEach((etiqueta) =>
				expect(screen.getByLabelText(new RegExp(`^${etiqueta}`))).toHaveAttribute("type", "password"),
			);
		});

		it("con los datos correctos cambia la contrasena y limpia el formulario (RF-23 CA4)", async () => {
			montar();

			await llenar("cliente123", "nueva1234", "nueva1234");

			expect(screen.getByText("Tu contrasena se cambio correctamente.")).toBeInTheDocument();
			expect(usuario(CAMILA).contrasena).toBe("nueva1234");
			expect(screen.getByLabelText(/^Contrasena actual/)).toHaveValue("");
		});

		it("se rechaza si la actual es incorrecta", async () => {
			montar();

			await llenar("incorrecta", "nueva1234", "nueva1234");

			expect(screen.getByText("La contrasena actual no es correcta.")).toBeInTheDocument();
			expect(usuario(CAMILA).contrasena).toBe("cliente123");
		});

		it("se rechaza si la nueva y su repeticion no coinciden", async () => {
			montar();

			await llenar("cliente123", "nueva1234", "otra12345");

			expect(screen.getByText("La contrasena nueva y su repeticion no coinciden.")).toBeInTheDocument();
			expect(usuario(CAMILA).contrasena).toBe("cliente123");
		});

		it("se rechaza si la nueva es igual a la actual", async () => {
			montar();

			await llenar("cliente123", "cliente123", "cliente123");

			expect(screen.getByText("La contrasena nueva debe ser distinta de la actual.")).toBeInTheDocument();
		});

		it("una nueva fuera de 4 a 10 caracteres muestra su error", async () => {
			montar();

			await userEvent.type(screen.getByLabelText(/^Contrasena nueva/), "abc");

			expect(screen.getByText("La contrasena debe tener entre 4 y 10 caracteres.")).toBeInTheDocument();
		});

		it("los campos vacios impiden el envio", async () => {
			montar();

			await userEvent.click(screen.getByRole("button", { name: "Cambiar contrasena" }));

			expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(3);
		});
	});

	it("enPanel ubica la vista dentro del panel de administracion (RF-23 CA5)", () => {
		const { container } = montar({ enPanel: true }, "190110222");

		expect(container.querySelector("main")).toHaveClass("col-12", "col-lg-9");
		expect(screen.getByText("Administrador")).toBeInTheDocument();
	});

	it("fuera del panel la vista no lleva las clases de columna", () => {
		const { container } = montar();

		expect(container.querySelector("main")).not.toHaveClass("col-lg-9");
	});

	it("si la cuenta de la sesion ya no existe, avisa que cierre sesion", () => {
		renderConProviders(<Perfil />, { sesion: { run: "99999999K", nombre: "X", apellidos: "Y", correo: "x@gmail.com", rol: "CLIENTE" } });

		expect(screen.getByText(/No encontramos los datos de tu cuenta/)).toBeInTheDocument();
		expect(screen.queryByRole("form")).not.toBeInTheDocument();
	});
});

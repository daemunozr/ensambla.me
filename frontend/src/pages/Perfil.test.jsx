import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usuario } from "../data/datos.js";
import { baseDeDatos, llamadas } from "../testing/apiFalsa.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import Perfil from "./Perfil.jsx";

const CAMILA = "123456785";
// La cuenta se pide a la API: se espera a que aparezca el formulario.
async function montar(props = {}, run = CAMILA) {
	const resultado = renderConProviders(<Perfil {...props} />, { sesion: sesionDe(usuario(run)) });
	await screen.findByRole("heading", { level: 2, name: "Tus datos" });
	return resultado;
}
const cuentaEnApi = (run = CAMILA) => baseDeDatos().usuarios.find((u) => u.run === run);
const sesionGuardada = () => JSON.parse(window.sessionStorage.getItem("sesion"));

describe("Perfil", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el RUN y el tipo de usuario como datos de solo lectura (RF-23 CA1)", async () => {
		await montar();

		expect(screen.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeInTheDocument();
		expect(screen.getByText("123456785")).toBeInTheDocument();
		expect(screen.getByText("Cliente")).toBeInTheDocument();
		expect(screen.queryByLabelText(/^RUN/)).not.toBeInTheDocument();
	});

	it("el formulario parte con los datos de la cuenta", async () => {
		await montar();

		expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Camila");
		expect(screen.getByLabelText(/^Apellidos/)).toHaveValue("Soto Vera");
		expect(screen.getByLabelText(/^Correo/)).toHaveValue("camila@gmail.com");
		expect(screen.getByLabelText(/^Direccion/)).toHaveValue("Irarrazaval 2550, Nunoa");
	});

	it("guardar actualiza la cuenta y la sesion, y la contrasena no cambia (RF-23 CA2 y CA3)", async () => {
		await montar();
		const nombre = screen.getByLabelText(/^Nombre/);

		await userEvent.clear(nombre);
		await userEvent.type(nombre, "Camila Andrea");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(await screen.findByText("Tus datos se guardaron correctamente.")).toBeInTheDocument();
		expect(cuentaEnApi()).toMatchObject({ nombre: "Camila Andrea", contrasena: "cliente123", tipoUsuario: "CLIENTE" });
		expect(sesionGuardada().nombre).toBe("Camila Andrea");
	});

	it("un dato invalido muestra su error y no guarda", async () => {
		await montar();
		const correo = screen.getByLabelText(/^Correo/);

		await userEvent.clear(correo);
		await userEvent.type(correo, "camila@hotmail.com");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
		expect(screen.queryByText("Tus datos se guardaron correctamente.")).not.toBeInTheDocument();
		expect(cuentaEnApi().correo).toBe("camila@gmail.com");
	});

	it("un campo obligatorio vacio impide guardar", async () => {
		await montar();

		await userEvent.clear(screen.getByLabelText(/^Direccion/));
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText("Este campo es obligatorio.")).toBeInTheDocument();
		expect(cuentaEnApi().direccion).toBe("Irarrazaval 2550, Nunoa");
	});

	it("un correo que usa otra cuenta se rechaza (RF-23 CA2)", async () => {
		await montar();
		const correo = screen.getByLabelText(/^Correo/);

		await userEvent.clear(correo);
		await userEvent.type(correo, "matias@gmail.com");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un usuario con el correo matias@gmail.com.");
		expect(cuentaEnApi().correo).toBe("camila@gmail.com");
	});

	it("cambiar la region recarga las comunas y exige escoger una", async () => {
		await montar();

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

		it("los tres campos son de tipo password (RNF-02 CA3)", async () => {
			await montar();

			["Contrasena actual", "Contrasena nueva", "Repite la contrasena nueva"].forEach((etiqueta) =>
				expect(screen.getByLabelText(new RegExp(`^${etiqueta}`))).toHaveAttribute("type", "password"),
			);
		});

		it("con los datos correctos cambia la contrasena y limpia el formulario (RF-23 CA4)", async () => {
			await montar();

			await llenar("cliente123", "nueva1234", "nueva1234");

			expect(await screen.findByText("Tu contrasena se cambio correctamente.")).toBeInTheDocument();
			expect(cuentaEnApi().contrasena).toBe("nueva1234");
			expect(screen.getByLabelText(/^Contrasena actual/)).toHaveValue("");
		});

		it("se rechaza si la actual es incorrecta", async () => {
			await montar();

			await llenar("incorrecta", "nueva1234", "nueva1234");

			expect(await screen.findByText("La contrasena actual no es correcta.")).toBeInTheDocument();
			expect(cuentaEnApi().contrasena).toBe("cliente123");
		});

		it("se rechaza si la nueva y su repeticion no coinciden", async () => {
			await montar();

			await llenar("cliente123", "nueva1234", "otra12345");

			expect(screen.getByText("La contrasena nueva y su repeticion no coinciden.")).toBeInTheDocument();
			expect(cuentaEnApi().contrasena).toBe("cliente123");
		});

		it("se rechaza si la nueva es igual a la actual", async () => {
			await montar();

			await llenar("cliente123", "cliente123", "cliente123");

			expect(screen.getByText("La contrasena nueva debe ser distinta de la actual.")).toBeInTheDocument();
		});

		it("una nueva fuera de 4 a 10 caracteres muestra su error", async () => {
			await montar();

			await userEvent.type(screen.getByLabelText(/^Contrasena nueva/), "abc");

			expect(screen.getByText("La contrasena debe tener entre 4 y 10 caracteres.")).toBeInTheDocument();
		});

		it("los campos vacios impiden el envio", async () => {
			await montar();

			await userEvent.click(screen.getByRole("button", { name: "Cambiar contrasena" }));

			expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(3);
		});
	});

	it("pide la cuenta a GET /usuarios/me y guarda con PUT /usuarios/me, enviando la region deducida de la comuna", async () => {
		await montar();
		const nombre = screen.getByLabelText(/^Nombre/);

		await userEvent.clear(nombre);
		await userEvent.type(nombre, "Cami");
		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));
		await screen.findByText("Tus datos se guardaron correctamente.");

		expect(llamadas.map((l) => `${l.metodo} ${l.ruta}`)).toEqual(expect.arrayContaining(["GET /usuarios/me", "PUT /usuarios/me"]));
		const cuerpo = llamadas.find((l) => l.metodo === "PUT").cuerpo;
		expect(cuerpo).toMatchObject({ nombre: "Cami", region: "RM", comuna: "RM-04", contrasenaActual: null, contrasenaNueva: null });
		expect(cuerpo).not.toHaveProperty("tipoUsuario");
	});

	it("el cambio de contrasena envia la actual y la nueva al servidor, que es quien la comprueba", async () => {
		await montar();
		await userEvent.type(screen.getByLabelText(/^Contrasena actual/), "cliente123");
		await userEvent.type(screen.getByLabelText(/^Contrasena nueva/), "nueva1234");
		await userEvent.type(screen.getByLabelText(/^Repite la contrasena nueva/), "nueva1234");
		await userEvent.click(screen.getByRole("button", { name: "Cambiar contrasena" }));
		await screen.findByText("Tu contrasena se cambio correctamente.");

		expect(llamadas.find((l) => l.metodo === "PUT").cuerpo).toMatchObject({ contrasenaActual: "cliente123", contrasenaNueva: "nueva1234" });
	});

	it("un personal de logistica tambien ve y edita su perfil, aunque no pueda listar usuarios", async () => {
		const bodega = (await import("../data/semillas.js")).usuarios.find((u) => u.tipoUsuario === "LOGISTICA");
		await montar({}, bodega.run);

		expect(screen.getByLabelText(/^Correo/)).toHaveValue(bodega.correo);
		expect(llamadas.some((l) => l.ruta === "/usuarios")).toBe(false);
	});

	it("enPanel ubica la vista dentro del panel de administracion (RF-23 CA5)", async () => {
		const { container } = await montar({ enPanel: true }, "190110222");

		expect(container.querySelector("main")).toHaveClass("col-12", "col-lg-9");
		expect(screen.getByText("Administrador")).toBeInTheDocument();
	});

	it("fuera del panel la vista no lleva las clases de columna", async () => {
		const { container } = await montar();

		expect(container.querySelector("main")).not.toHaveClass("col-lg-9");
	});

	it("si la cuenta de la sesion ya no existe, avisa que cierre sesion", async () => {
		renderConProviders(<Perfil />, { sesion: { ...sesionDe({ run: "99999999K", nombre: "X", apellidos: "Y", correo: "x@gmail.com", tipoUsuario: "CLIENTE" }) } });

		expect(await screen.findByText(/No pudimos cargar los datos de tu cuenta/)).toBeInTheDocument();
		expect(screen.queryByRole("form")).not.toBeInTheDocument();
	});
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Contacto from "./Contacto.jsx";

async function completar({ nombre = "Ana Perez", correo = "ana@gmail.com", comentario = "Hola, tengo una duda." } = {}) {
	if (nombre) await userEvent.type(screen.getByLabelText(/^Nombre/), nombre);
	if (correo) await userEvent.type(screen.getByLabelText(/^Correo/), correo);
	if (comentario) await userEvent.type(screen.getByLabelText(/^Comentario/), comentario);
}

describe("Contacto", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el formulario y los datos de la tienda", () => {
		renderConProviders(<Contacto />);

		expect(screen.getByRole("heading", { level: 1, name: "Contacto" })).toBeInTheDocument();
		expect(screen.getByLabelText(/^Comentario/).tagName).toBe("TEXTAREA");
		expect(screen.getByRole("link", { name: "contacto@ensambla.me" })).toHaveAttribute("href", "mailto:contacto@ensambla.me");
	});

	it("enviar vacio muestra un error por campo y ningun aviso de exito", async () => {
		renderConProviders(<Contacto />);

		await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

		expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(3);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("un correo con dominio no permitido impide el envio", async () => {
		renderConProviders(<Contacto />);

		await completar({ correo: "ana@hotmail.com" });
		await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

		expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("un envio correcto confirma con el nombre y limpia el formulario", async () => {
		renderConProviders(<Contacto />);

		await completar({ correo: "ANA@gmail.com" });
		await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

		expect(screen.getByRole("alert")).toHaveTextContent("Gracias Ana Perez, recibimos tu mensaje. Te responderemos a ana@gmail.com");
		expect(screen.getByLabelText(/^Nombre/)).toHaveValue("");
		expect(screen.getByLabelText(/^Comentario/)).toHaveValue("");
	});
});

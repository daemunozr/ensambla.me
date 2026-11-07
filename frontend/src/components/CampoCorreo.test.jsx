import { render, screen } from "@testing-library/react";
import CampoCorreo from "./CampoCorreo.jsx";

describe("CampoCorreo", () => {
	it("es un campo de correo ligado a su lista de sugerencias", () => {
		render(<CampoCorreo id="correo" etiqueta="Correo" value="" onChange={() => {}} />);

		const control = screen.getByLabelText("Correo");
		expect(control).toHaveAttribute("type", "email");
		expect(control).toHaveAttribute("list", "dominios-correo");
	});

	it("sugiere los dominios permitidos completando lo escrito", () => {
		const { container } = render(<CampoCorreo id="correo" etiqueta="Correo" value="ana" onChange={() => {}} />);

		const opciones = [...container.querySelectorAll("datalist#dominios-correo option")].map((o) => o.value);
		expect(opciones).toEqual(["ana@duoc.cl", "ana@profesor.duoc.cl", "ana@gmail.com"]);
	});
});

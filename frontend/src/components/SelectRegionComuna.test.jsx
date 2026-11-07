import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { comunasDe, regiones } from "../data/datos.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { reglas } from "../utils/validaciones.js";
import SelectRegionComuna from "./SelectRegionComuna.jsx";

const DEFINICION = {
	region: [reglas.seleccion("Selecciona tu region.")],
	comuna: [reglas.seleccion("Selecciona tu comuna.")],
};

function Prueba({ inicial = { region: "", comuna: "" } }) {
	const formulario = useFormulario(inicial, DEFINICION);
	return <SelectRegionComuna formulario={formulario} prefijo="x" />;
}

const opciones = (select) => within(select).getAllByRole("option").map((o) => o.value);

describe("SelectRegionComuna", () => {
	it("ofrece todas las regiones y ninguna comuna hasta escoger una (RF-01 CA5)", () => {
		render(<Prueba />);

		expect(opciones(screen.getByLabelText(/^Region/))).toHaveLength(regiones.length + 1);
		expect(opciones(screen.getByLabelText(/^Comuna/))).toEqual([""]);
	});

	it("al escoger una region, la comuna ofrece solo las de esa region", async () => {
		render(<Prueba />);

		await userEvent.selectOptions(screen.getByLabelText(/^Region/), "RM");

		const esperadas = comunasDe("RM").map((c) => c.codigo);
		expect(opciones(screen.getByLabelText(/^Comuna/))).toEqual(["", ...esperadas]);
	});

	it("cambiar de region descarta la comuna que estaba escogida", async () => {
		render(<Prueba inicial={{ region: "RM", comuna: "RM-02" }} />);
		expect(screen.getByLabelText(/^Comuna/)).toHaveValue("RM-02");

		await userEvent.selectOptions(screen.getByLabelText(/^Region/), "BI");

		expect(screen.getByLabelText(/^Comuna/)).toHaveValue("");
		expect(opciones(screen.getByLabelText(/^Comuna/))).not.toContain("RM-02");
	});

	it("parte con los valores iniciales", () => {
		render(<Prueba inicial={{ region: "BI", comuna: "BI-01" }} />);

		expect(screen.getByLabelText(/^Region/)).toHaveValue("BI");
		expect(screen.getByLabelText(/^Comuna/)).toHaveValue("BI-01");
	});

	it("ambos campos son obligatorios y llevan su sugerencia", () => {
		render(<Prueba />);

		expect(screen.getByLabelText(/^Region/)).toBeRequired();
		expect(screen.getByLabelText(/^Comuna/)).toBeRequired();
		expect(screen.getByText("Al cambiarla se recargan sus comunas.")).toBeInTheDocument();
		expect(screen.getByText("Solo las comunas de la region escogida.")).toBeInTheDocument();
	});

	it("dejar la region sin escoger muestra su error al perder el foco", async () => {
		render(<Prueba />);

		await userEvent.click(screen.getByLabelText(/^Region/));
		await userEvent.tab();

		expect(screen.getByText("Selecciona tu region.")).toBeInTheDocument();
		expect(screen.getByLabelText(/^Region/)).toHaveClass("is-invalid");
	});
});

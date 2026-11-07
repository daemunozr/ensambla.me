import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FiltrosCatalogo from "./FiltrosCatalogo.jsx";

const VACIOS = { q: "", categoria: "", min: null, max: null, oferta: false, stock: false, orden: "" };
const CATEGORIAS = [
	{ codigo: "cpu", nombre: "Procesadores" },
	{ codigo: "ram", nombre: "Memoria RAM" },
];

function montar(criterios = {}, props = {}) {
	const aplicar = vi.fn();
	render(<FiltrosCatalogo criterios={{ ...VACIOS, ...criterios }} aplicar={aplicar} categorias={CATEGORIAS} {...props} />);
	return aplicar;
}

describe("FiltrosCatalogo", () => {
	it("muestra los campos con los criterios recibidos", () => {
		montar({ q: "ram", categoria: "cpu", min: 1000, stock: true });

		expect(screen.getByRole("search")).toBeInTheDocument();
		expect(screen.getByLabelText("Buscar")).toHaveValue("ram");
		expect(screen.getByLabelText("Categoria")).toHaveValue("cpu");
		expect(screen.getByLabelText("Precio minimo")).toHaveValue(1000);
		expect(screen.getByLabelText("Precio maximo")).toHaveValue(null);
		expect(screen.getByLabelText("Solo con stock")).toBeChecked();
		expect(screen.getByLabelText("Solo ofertas")).not.toBeChecked();
	});

	it("ofrece una opcion por cada categoria y una para todas", () => {
		montar();

		expect(screen.getByRole("option", { name: "Todas" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Procesadores" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Memoria RAM" })).toBeInTheDocument();
	});

	it("la casilla de ofertas solo aparece si conOferta es verdadero", () => {
		montar({}, { conOferta: false });

		expect(screen.queryByLabelText("Solo ofertas")).not.toBeInTheDocument();
	});

	it("usa el prefijo para los id de los campos", () => {
		montar({}, { prefijo: "cat" });

		expect(screen.getByLabelText("Buscar")).toHaveAttribute("id", "cat-q");
	});

	it("escribir no aplica el filtro hasta enviar el formulario", async () => {
		const aplicar = montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "ryzen");
		expect(aplicar).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
		expect(aplicar).toHaveBeenCalledTimes(1);
		expect(aplicar).toHaveBeenCalledWith(expect.objectContaining({ q: "ryzen" }));
	});

	it("enviar con Enter tambien aplica el filtro", async () => {
		const aplicar = montar();

		await userEvent.type(screen.getByLabelText("Buscar"), "ram{Enter}");

		expect(aplicar).toHaveBeenCalledWith(expect.objectContaining({ q: "ram" }));
	});

	it("cambiar la categoria aplica el filtro de inmediato", async () => {
		const aplicar = montar();

		await userEvent.selectOptions(screen.getByLabelText("Categoria"), "ram");

		expect(aplicar).toHaveBeenCalledWith(expect.objectContaining({ categoria: "ram" }));
	});

	it("marcar una casilla aplica el filtro de inmediato", async () => {
		const aplicar = montar();

		await userEvent.click(screen.getByLabelText("Solo con stock"));

		expect(aplicar).toHaveBeenCalledWith(expect.objectContaining({ stock: true }));
	});

	it("Limpiar filtros aplica criterios vacios", async () => {
		const aplicar = montar({ q: "ram" });

		await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

		expect(aplicar).toHaveBeenCalledWith({});
	});

	it("avisa cuando el precio minimo supera al maximo", async () => {
		montar();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();

		await userEvent.type(screen.getByLabelText("Precio minimo"), "500");
		await userEvent.type(screen.getByLabelText("Precio maximo"), "100");

		expect(screen.getByRole("alert")).toHaveTextContent("El precio minimo no puede superar al maximo.");
	});

	it("si los criterios cambian desde afuera, el formulario se actualiza", () => {
		const aplicar = vi.fn();
		const { rerender } = render(<FiltrosCatalogo criterios={VACIOS} aplicar={aplicar} categorias={CATEGORIAS} />);

		rerender(<FiltrosCatalogo criterios={{ ...VACIOS, q: "gpu" }} aplicar={aplicar} categorias={CATEGORIAS} />);

		expect(screen.getByLabelText("Buscar")).toHaveValue("gpu");
	});
});

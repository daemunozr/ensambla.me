import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { categoria, categorias } from "../../data/datos.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import FormularioCategoria from "./FormularioCategoria.jsx";

function Ubicacion() {
	const { pathname, search } = useLocation();
	return <p data-testid="ubicacion">{pathname + search}</p>;
}

function montar(ruta = "/admin/categorias/nueva") {
	return renderConProviders(
		<>
			<Routes>
				<Route path="/admin/categorias/nueva" element={<FormularioCategoria />} />
				<Route path="/admin/categorias/:codigo/editar" element={<FormularioCategoria />} />
				<Route path="/admin/categorias" element={<p>Listado</p>} />
			</Routes>
			<Ubicacion />
		</>,
		{ ruta, sesion: SESION_ADMIN },
	);
}

const campo = (etiqueta) => screen.getByLabelText(new RegExp(`^${etiqueta}`));
const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar categoria" }));

describe("admin / FormularioCategoria", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("crear", () => {
		it("muestra el formulario vacio con codigo y nombre obligatorios", () => {
			montar();

			expect(screen.getByRole("heading", { level: 1, name: "Nueva categoria" })).toBeInTheDocument();
			expect(campo("Codigo")).toBeRequired();
			expect(campo("Nombre")).toBeRequired();
			expect(campo("Codigo")).toHaveAttribute("maxlength", "30");
			expect(campo("Nombre")).toHaveAttribute("maxlength", "50");
		});

		it("enviar vacio marca ambos campos y no crea la categoria", async () => {
			montar();
			const antes = categorias().length;

			await guardar();

			expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(2);
			expect(categorias()).toHaveLength(antes);
		});

		it("el codigo debe tener entre 3 y 30 caracteres (RF-25 CA2)", async () => {
			montar();

			await userEvent.type(campo("Codigo"), "ab");
			expect(screen.getByText("Debe tener al menos 3 caracteres.")).toBeInTheDocument();
		});

		it.each(["Monitores", "mis monitores", "camaras_web", "cámaras"])("rechaza el codigo «%s» por sus caracteres (RF-25 CA2)", async (codigo) => {
			montar();

			await userEvent.type(campo("Codigo"), codigo);

			expect(screen.getByText("Usa solo minusculas, numeros y guiones, sin espacios ni tildes.")).toBeInTheDocument();
		});

		it("acepta minusculas, numeros y guiones", async () => {
			montar();

			await userEvent.type(campo("Codigo"), "tarjetas-de-video-2");

			expect(campo("Codigo")).toHaveClass("is-valid");
		});

		it("con datos validos crea la categoria sin paso del asistente y vuelve al listado (RF-25 CA3)", async () => {
			montar();

			await userEvent.type(campo("Codigo"), "monitores");
			await userEvent.type(campo("Nombre"), "Monitores");
			await guardar();

			expect(categoria("monitores")).toEqual({ codigo: "monitores", nombre: "Monitores" });
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/categorias?guardada=Monitores");
		});

		it("un codigo repetido se rechaza (RF-25 CA2)", async () => {
			montar();

			await userEvent.type(campo("Codigo"), "cpu");
			await userEvent.type(campo("Nombre"), "Otra CPU");
			await guardar();

			expect(screen.getByRole("alert")).toHaveTextContent("Ya existe una categoria con el codigo cpu.");
			expect(categoria("cpu").nombre).toBe("Procesadores (CPU)");
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/categorias/nueva");
		});
	});

	describe("editar", () => {
		it("parte con los datos de la categoria y no deja cambiar su codigo (RF-25 CA2)", () => {
			montar("/admin/categorias/ram/editar");

			expect(screen.getByRole("heading", { level: 1, name: "Editar Memoria RAM" })).toBeInTheDocument();
			expect(campo("Codigo")).toHaveValue("ram");
			expect(campo("Codigo")).toHaveAttribute("readonly");
			expect(screen.getByText("El codigo identifica a la categoria y no se cambia.")).toBeInTheDocument();
			expect(campo("Nombre")).toHaveValue("Memoria RAM");
		});

		it("indica el paso del asistente de una categoria que participa en el armado", () => {
			montar("/admin/categorias/ram/editar");

			expect(screen.getByText("Esta categoria es el paso 3 del asistente de armado.")).toBeInTheDocument();
		});

		it("guardar cambia solo el nombre y conserva el paso del asistente", async () => {
			montar("/admin/categorias/ram/editar");

			const nombre = campo("Nombre");
			await userEvent.clear(nombre);
			await userEvent.type(nombre, "Memorias");
			await guardar();

			expect(categoria("ram")).toMatchObject({ nombre: "Memorias", orden: 3 });
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/categorias?guardada=Memorias");
		});

		it("un codigo que no existe avisa al abrir", () => {
			montar("/admin/categorias/nada/editar");

			expect(screen.getByRole("alert")).toHaveTextContent("No existe una categoria con el codigo nada.");
		});
	});

	it("«Volver al listado» regresa sin guardar", async () => {
		montar();

		await userEvent.click(screen.getByRole("link", { name: "Volver al listado" }));

		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/categorias");
	});
});

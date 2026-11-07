import { screen, within } from "@testing-library/react";
import { creditos } from "../data/creditos.js";
import { renderConProviders } from "../testUtils.jsx";
import Creditos from "./Creditos.jsx";

describe("Creditos", () => {
	it("cuenta las fotografias y cuantas muestran el modelo exacto", () => {
		renderConProviders(<Creditos />);
		const exactas = creditos.filter((c) => c.exacto).length;

		expect(screen.getByRole("heading", { level: 1, name: "Creditos de las imagenes" })).toBeInTheDocument();
		expect(screen.getByText(new RegExp(`Las ${creditos.length} fotografias de productos`))).toBeInTheDocument();
		expect(screen.getByText(new RegExp(`${exactas} fotos muestran el modelo exacto`))).toBeInTheDocument();
		expect(screen.getByText(new RegExp(`En las ${creditos.length - exactas} restantes`))).toBeInTheDocument();
	});

	it("la tabla tiene una fila por imagen con su autor y licencia", () => {
		renderConProviders(<Creditos />);

		const filas = within(screen.getByRole("table")).getAllByRole("row");
		expect(filas).toHaveLength(creditos.length + 1);
		const primera = filas[1];
		expect(primera).toHaveTextContent(creditos[0].sku);
		expect(primera).toHaveTextContent(creditos[0].autor);
		expect(within(primera).getByRole("link", { name: creditos[0].licencia })).toHaveAttribute("href", creditos[0].urlLicencia);
	});

	it("distingue el modelo exacto de la foto representativa", () => {
		renderConProviders(<Creditos />);

		expect(screen.getAllByText("Modelo exacto")).toHaveLength(creditos.filter((c) => c.exacto).length);
		expect(screen.getAllByText("Representativa")).toHaveLength(creditos.filter((c) => !c.exacto).length);
	});

	it("cada original enlaza a Wikimedia Commons con rel seguro", () => {
		renderConProviders(<Creditos />);

		const enlaces = screen.getAllByRole("link", { name: "Commons" });
		expect(enlaces).toHaveLength(creditos.length);
		expect(enlaces[0]).toHaveAttribute("href", creditos[0].original);
		expect(enlaces[0]).toHaveAttribute("rel", expect.stringContaining("noopener"));
	});
});

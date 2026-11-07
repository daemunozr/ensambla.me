import { render, screen } from "@testing-library/react";
import ImagenProducto from "./ImagenProducto.jsx";

const producto = { nombre: "Ryzen 5", imagen: "resources/img/productos/CPU-R5-7600.webp" };

describe("ImagenProducto", () => {
	it("muestra la imagen con el nombre del producto como texto alternativo", () => {
		render(<ImagenProducto producto={producto} className="imagen" />);

		const imagen = screen.getByRole("img", { name: "Ryzen 5" });
		expect(imagen).toHaveAttribute("src", expect.stringContaining("resources/img/productos/CPU-R5-7600.webp"));
		expect(imagen).toHaveClass("imagen");
	});

	it("usa el texto alternativo indicado", () => {
		render(<ImagenProducto producto={producto} alt="Procesador" />);

		expect(screen.getByRole("img", { name: "Procesador" })).toBeInTheDocument();
	});

	it("carga perezosa solo si se pide", () => {
		const { rerender } = render(<ImagenProducto producto={producto} />);
		expect(screen.getByRole("img")).not.toHaveAttribute("loading");

		rerender(<ImagenProducto producto={producto} lazy />);
		expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
	});

	it("sin imagen deja un recuadro vacio del mismo tamano", () => {
		const { container } = render(<ImagenProducto producto={{ nombre: "Sin foto", imagen: "" }} className="imagen" />);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(container.querySelector(".sin-imagen")).toHaveClass("imagen");
	});
});

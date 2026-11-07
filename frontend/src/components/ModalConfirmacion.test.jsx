import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalConfirmacion from "./ModalConfirmacion.jsx";

function montar(props = {}) {
	const onConfirmar = vi.fn();
	const onCancelar = vi.fn();
	render(
		<ModalConfirmacion abierto titulo="Eliminar producto" onConfirmar={onConfirmar} onCancelar={onCancelar} {...props}>
			<p>Esta accion no se puede deshacer.</p>
		</ModalConfirmacion>,
	);
	return { onConfirmar, onCancelar };
}

describe("ModalConfirmacion", () => {
	it("cerrado no muestra nada", () => {
		montar({ abierto: false });

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("abierto muestra el titulo y el contenido en un dialogo con nombre", () => {
		montar();

		expect(screen.getByRole("dialog", { name: "Eliminar producto" })).toBeInTheDocument();
		expect(screen.getByText("Esta accion no se puede deshacer.")).toBeInTheDocument();
	});

	it("al abrirse enfoca Cancelar", () => {
		montar();

		expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
	});

	it("el boton de confirmar dice Eliminar por defecto y acepta otro texto", () => {
		montar({ textoConfirmar: "Quitar" });

		expect(screen.getByRole("button", { name: "Quitar" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
	});

	it("confirmar llama a onConfirmar", async () => {
		const { onConfirmar, onCancelar } = montar();

		await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

		expect(onConfirmar).toHaveBeenCalledTimes(1);
		expect(onCancelar).not.toHaveBeenCalled();
	});

	it("Cancelar y la X llaman a onCancelar", async () => {
		const { onCancelar, onConfirmar } = montar();

		await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
		await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

		expect(onCancelar).toHaveBeenCalledTimes(2);
		expect(onConfirmar).not.toHaveBeenCalled();
	});

	it("Escape cierra sin confirmar", async () => {
		const { onCancelar, onConfirmar } = montar();

		await userEvent.keyboard("{Escape}");

		expect(onCancelar).toHaveBeenCalledTimes(1);
		expect(onConfirmar).not.toHaveBeenCalled();
	});

	it("un clic en el fondo cierra, pero uno dentro del contenido no", async () => {
		const { onCancelar } = montar();

		await userEvent.click(screen.getByText("Esta accion no se puede deshacer."));
		expect(onCancelar).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("dialog"));
		expect(onCancelar).toHaveBeenCalledTimes(1);
	});

	it("cerrado no escucha el teclado", async () => {
		const { onCancelar } = montar({ abierto: false });

		await userEvent.keyboard("{Escape}");

		expect(onCancelar).not.toHaveBeenCalled();
	});
});

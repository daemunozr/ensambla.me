import { useEffect, useId, useRef } from "react";

/**
 * Dialogo de confirmacion con el aspecto del modal de Bootstrap, controlado
 * por React (sin el JS de Bootstrap ni window.confirm). Al abrirse enfoca
 * "Cancelar"; Escape o un clic en el fondo lo cierran sin confirmar.
 */
export default function ModalConfirmacion({
	abierto,
	titulo,
	children,
	textoConfirmar = "Eliminar",
	onConfirmar,
	onCancelar,
}) {
	const idTitulo = useId();
	const botonCancelar = useRef(null);

	useEffect(() => {
		if (!abierto) return undefined;
		botonCancelar.current?.focus();
		const alPulsar = (evento) => {
			if (evento.key === "Escape") onCancelar();
		};
		document.addEventListener("keydown", alPulsar);
		return () => document.removeEventListener("keydown", alPulsar);
	}, [abierto, onCancelar]);

	if (!abierto) return null;

	return (
		<>
			<div
				className="modal d-block"
				role="dialog"
				aria-modal="true"
				aria-labelledby={idTitulo}
				onClick={(evento) => evento.target === evento.currentTarget && onCancelar()}
			>
				<div className="modal-dialog modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-header">
							<h2 className="modal-title h5" id={idTitulo}>
								{titulo}
							</h2>
							<button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancelar}></button>
						</div>
						<div className="modal-body">{children}</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-outline-secondary" ref={botonCancelar} onClick={onCancelar}>
								Cancelar
							</button>
							<button type="button" className="btn btn-danger" onClick={onConfirmar}>
								{textoConfirmar}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="modal-backdrop show"></div>
		</>
	);
}

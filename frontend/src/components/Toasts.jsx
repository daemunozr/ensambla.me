/** Confirmaciones visuales del carrito, abajo a la derecha (RF-05 CA3). */
export default function Toasts({ avisos, onCerrar }) {
	if (!avisos.length) return null;

	return (
		<div className="toast-container position-fixed bottom-0 end-0 p-3">
			{avisos.map((aviso) => (
				<output key={aviso.id} className="toast show align-items-center text-bg-dark border-0 d-flex">
					<span className="toast-body">{aviso.texto}</span>
					<button
						type="button"
						className="btn-close btn-close-white me-2 m-auto"
						aria-label="Cerrar"
						onClick={() => onCerrar(aviso.id)}
					></button>
				</output>
			))}
		</div>
	);
}

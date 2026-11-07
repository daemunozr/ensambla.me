/** Aviso de exito o error de una accion (alert de Bootstrap). */
export default function Alerta({ tipo = "success", children }) {
	return (
		<div className={`alert alert-${tipo}`} role="alert">
			{children}
		</div>
	);
}

/**
 * Zona que anuncia los avisos a los lectores de pantalla. aviso es
 * { tipo, contenido } o null.
 */
export function ZonaAviso({ aviso }) {
	return <div aria-live="polite">{aviso && <Alerta tipo={aviso.tipo}>{aviso.contenido}</Alerta>}</div>;
}

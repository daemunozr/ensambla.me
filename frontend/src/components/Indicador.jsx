/** Indicador de un resumen: titulo, cifra y nota. */
export default function Indicador({ titulo, valor, nota }) {
	return (
		<div className="col">
			<article className="tarjeta-indicador h-100 p-3">
				<p className="etiqueta-categoria mb-1">{titulo}</p>
				<p className="cifra mb-1">{valor}</p>
				<p className="small text-secondary mb-0">{nota}</p>
			</article>
		</div>
	);
}

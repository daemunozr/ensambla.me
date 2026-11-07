import EstadoVacio from "./EstadoVacio.jsx";

/**
 * Tabla de un reporte con una barra por fila. filas es
 * [{ clave, etiqueta, detalle, valor, valorTexto }]: la barra es proporcional
 * al mayor valor y el valor siempre se escribe tambien como texto.
 */
export default function TablaBarras({ titulo, columna, filas, mensajeVacio = "No hay datos para mostrar." }) {
	if (!filas.length) {
		return (
			<EstadoVacio>
				<p className="mb-0">{mensajeVacio}</p>
			</EstadoVacio>
		);
	}

	const maximo = Math.max(...filas.map((fila) => fila.valor), 0) || 1;

	return (
		<div className="table-responsive">
			<table className="table tabla-admin align-middle">
				<caption className="visually-hidden">{titulo}</caption>
				<thead>
					<tr>
						<th scope="col">{columna}</th>
						<th scope="col" className="columna-barra">
							<span className="visually-hidden">Proporcion</span>
						</th>
						<th scope="col" className="text-end">
							Valor
						</th>
					</tr>
				</thead>
				<tbody>
					{filas.map((fila) => (
						<tr key={fila.clave}>
							<td>
								{fila.etiqueta}
								{fila.detalle && <span className="d-block small text-secondary">{fila.detalle}</span>}
							</td>
							<td className="columna-barra">
								<progress
									className="barra-reporte"
									value={fila.valor}
									max={maximo}
									aria-label={`${fila.etiqueta}: ${fila.valorTexto}`}
								>
									{fila.valorTexto}
								</progress>
							</td>
							<td className="text-end text-nowrap">{fila.valorTexto}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

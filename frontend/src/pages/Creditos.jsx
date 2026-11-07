import { creditos } from "../data/creditos.js";
import { useTitulo } from "../hooks/useTitulo.js";

/** Atribucion exigida por las licencias Creative Commons de las fotos de productos. */
export default function Creditos() {
	useTitulo("Creditos de imagenes — Ensambla.me");
	const exactas = creditos.filter((credito) => credito.exacto).length;

	return (
		<main>
			<p className="sobretitulo">Atribucion</p>
			<h1 className="h3">Creditos de las imagenes</h1>

			<section className="mb-4">
				<p>
					Las {creditos.length} fotografias de productos provienen de{" "}
					<a href="https://commons.wikimedia.org/" rel="noopener">
						Wikimedia Commons
					</a>{" "}
					y se usan bajo las licencias indicadas en la tabla, que exigen reconocer a la persona autora y la
					licencia. Cada archivo se recorto o ajusto a 900 &times; 563 px y se convirtio a WebP; no se les hizo
					ninguna otra modificacion. Las licencias CC BY-SA y FAL piden ademas compartir las versiones
					modificadas con la misma licencia. Los autores no patrocinan ni respaldan este proyecto.
				</p>
				<p className="mb-0">
					{exactas} fotos muestran el modelo exacto del producto. En las {creditos.length - exactas} restantes la
					foto es <em>representativa</em>: muestra un componente de la misma categoria o familia, porque Commons
					no tiene fotografias libres de ese modelo concreto. Es un catalogo de demostracion y las imagenes no
					deben leerse como la ficha tecnica del producto.
				</p>
			</section>

			<section>
				<h2 className="h5 titulo-seccion mb-3">Detalle por producto</h2>
				<div className="table-responsive">
					<table className="table table-hover tabla-admin align-middle small">
						<caption className="visually-hidden">Autoria y licencia de cada imagen de producto</caption>
						<thead>
							<tr>
								<th scope="col">SKU</th>
								<th scope="col">Coincidencia</th>
								<th scope="col">Que muestra</th>
								<th scope="col">Autor</th>
								<th scope="col">Licencia</th>
								<th scope="col">Original</th>
							</tr>
						</thead>
						<tbody>
							{creditos.map((credito) => (
								<tr key={credito.sku}>
									<td>
										<code>{credito.sku}</code>
									</td>
									<td>
										{credito.exacto ? (
											<span className="badge text-bg-success">Modelo exacto</span>
										) : (
											<span className="badge text-bg-secondary">Representativa</span>
										)}
									</td>
									<td>{credito.muestra}</td>
									<td>{credito.autor}</td>
									<td>
										<a href={credito.urlLicencia} rel="license noopener">
											{credito.licencia}
										</a>
									</td>
									<td>
										<a href={credito.original} rel="noopener">
											Commons
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="small text-secondary mt-3 mb-0">
					Las ilustraciones SVG de <code>resources/img/</code> (<code>cpu.svg</code>, <code>gpu.svg</code>, etc.) son
					propias del proyecto y sirven de respaldo para los productos creados sin imagen.
				</p>
			</section>
		</main>
	);
}

import { Link, useSearchParams } from "react-router";
import { useDatos } from "../../context/datos.js";

/** Barra lateral de las vistas de tienda: categorias del catalogo (RF-14 CA3, RNF-08 CA3). */
export default function Aside() {
	const { categorias } = useDatos();
	const [parametros] = useSearchParams();
	const activa = parametros.get("categoria") ?? "";

	return (
		<aside className="col-12 col-lg-3 barra-categorias">
			<h2 className="sobretitulo mb-2">Categorias</h2>
			<nav className="list-group mb-3" aria-label="Categorias del catalogo">
				{categorias.map((categoria) => {
					const esActiva = categoria.codigo === activa;
					return (
						<Link
							key={categoria.codigo}
							className={`list-group-item list-group-item-action${esActiva ? " activa" : ""}`}
							to={`/productos?categoria=${encodeURIComponent(categoria.codigo)}`}
							aria-current={esActiva ? "page" : undefined}
						>
							{categoria.nombre}
						</Link>
					);
				})}
			</nav>

			<section className="card tarjeta-aviso">
				<div className="card-body">
					<h3 className="card-title h6">Armado guiado</h3>
					<p className="card-text small">
						Escoge pieza por pieza y el asistente te ofrece solo lo compatible con lo ya elegido.
					</p>
					<Link to="/armado" className="btn btn-sm btn-success">
						Armar mi PC
					</Link>
				</div>
			</section>
		</aside>
	);
}

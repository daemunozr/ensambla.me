import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { blogs } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { fecha } from "../utils/formato.js";
import { recurso } from "../utils/recursos.js";

/** Tarjeta de un articulo en el listado: imagen, titulo y descripcion corta (RF-09 CA1). */
function TarjetaBlog({ articulo }) {
	const enlace = `/blogs/${encodeURIComponent(articulo.slug)}`;
	return (
		<div className="col">
			<article className="card tarjeta-blog h-100">
				<Link to={enlace} aria-label={`Leer ${articulo.titulo}`}>
					<img src={recurso(articulo.imagen)} alt="" className="imagen-blog card-img-top" />
				</Link>
				<div className="card-body d-flex flex-column">
					<p className="etiqueta-categoria mb-1">
						{fecha(articulo.fecha)} &middot; {articulo.autor}
					</p>
					<h2 className="h6 card-title">
						<Link className="enlace-producto" to={enlace}>
							{articulo.titulo}
						</Link>
					</h2>
					<p className="card-text small">{articulo.resumen}</p>
					<Link className="btn btn-sm btn-outline-primary mt-auto align-self-start" to={enlace}>
						Leer el articulo
					</Link>
				</div>
			</article>
		</div>
	);
}

/** Listado de articulos del blog (RF-09). */
export default function Blogs() {
	useTitulo("Blogs — Ensambla.me");

	return (
		<main>
			<p className="sobretitulo">Taller Ensambla.me</p>
			<h1 className="h3">Blogs</h1>
			<p className="text-secondary mb-4">
				Lo que aprendimos armando equipos: en que orden montar las piezas, cuanta fuente necesitas y cuando
				conviene cambiar de memoria.
			</p>

			{blogs.length ? (
				<div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
					{blogs.map((articulo) => (
						<TarjetaBlog key={articulo.slug} articulo={articulo} />
					))}
				</div>
			) : (
				<EstadoVacio>
					<p className="mb-0">Todavia no hay articulos publicados.</p>
				</EstadoVacio>
			)}
		</main>
	);
}

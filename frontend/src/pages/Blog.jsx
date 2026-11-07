import { Link, useParams } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { blog } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { fecha } from "../utils/formato.js";
import { recurso } from "../utils/recursos.js";

/** Detalle de un articulo: imagen, titulo y descripcion larga (RF-09 CA2). */
export default function Blog() {
	const { slug = "" } = useParams();
	const articulo = blog(slug);
	useTitulo(articulo ? `${articulo.titulo} — Ensambla.me` : "Articulo no encontrado — Ensambla.me");

	const volver = (
		<Link className="btn btn-outline-primary" to="/blogs">
			Volver a los blogs
		</Link>
	);

	if (!articulo) {
		return (
			<main className="articulo-blog mx-auto">
				<h1 className="h3">Articulo no encontrado</h1>
				<EstadoVacio>
					<p>
						No existe un articulo con el identificador <strong>{slug || "(sin identificador)"}</strong>.
					</p>
					<Link className="btn btn-primary" to="/blogs">
						Volver a los blogs
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	return (
		<main className="articulo-blog mx-auto">
			<p className="etiqueta-categoria mb-1">
				{fecha(articulo.fecha)} &middot; {articulo.autor}
			</p>
			<h1 className="h3 mb-3">{articulo.titulo}</h1>
			<img src={recurso(articulo.imagen)} alt="" className="imagen-articulo mb-4" />
			<p className="lead">{articulo.resumen}</p>
			{articulo.cuerpo.map((parrafo) => (
				<p key={parrafo.slice(0, 40)}>{parrafo}</p>
			))}
			<p className="mt-4">{volver}</p>
		</main>
	);
}

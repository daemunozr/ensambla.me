import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { useTitulo } from "../hooks/useTitulo.js";

/** Ruta que no existe en el sitio. */
export default function NoEncontrada() {
	useTitulo("Pagina no encontrada — Ensambla.me");

	return (
		<main>
			<h1 className="h3 mb-3">Pagina no encontrada</h1>
			<EstadoVacio>
				<p>La direccion que buscas no existe.</p>
				<Link className="btn btn-primary" to="/">
					Volver al inicio
				</Link>
			</EstadoVacio>
		</main>
	);
}

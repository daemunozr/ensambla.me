import { Link } from "react-router";
import RejillaProductos from "../components/RejillaProductos.jsx";
import { useDatos } from "../context/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";

// Productos que se adelantan de cada categoria; el resto esta en "Ver todos".
const POR_CATEGORIA = 3;

/** Los productos separados por categoria, con acceso al listado completo de cada una. */
export default function Categorias() {
	useTitulo("Categorias — Ensambla.me");
	const { productos, categorias } = useDatos();

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Catalogo</p>
			<h1 className="h3">Categorias</h1>
			<p className="text-secondary">Los productos de la tienda separados por categoria.</p>

			{categorias.map((categoria) => {
				const suyos = productos.filter((p) => p.categoria === categoria.codigo);
				return (
					<section className="mb-5" key={categoria.codigo} aria-labelledby={`categoria-${categoria.codigo}`}>
						<div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
							<h2 className="h4 titulo-seccion mb-0" id={`categoria-${categoria.codigo}`}>
								{categoria.nombre}
							</h2>
							{suyos.length > 0 && (
								<Link to={`/productos?categoria=${encodeURIComponent(categoria.codigo)}`}>
									Ver {suyos.length === 1 ? "el producto" : `los ${suyos.length} productos`}
								</Link>
							)}
						</div>
						<RejillaProductos
							productos={suyos.slice(0, POR_CATEGORIA)}
							mensajeVacio={`Todavia no hay productos en ${categoria.nombre}.`}
						/>
					</section>
				);
			})}
		</main>
	);
}

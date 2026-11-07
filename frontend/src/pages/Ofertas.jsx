import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import FiltrosCatalogo from "../components/FiltrosCatalogo.jsx";
import RejillaProductos from "../components/RejillaProductos.jsx";
import { useDatos } from "../context/datos.js";
import { useCriterios } from "../hooks/useCriterios.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { filtrar, hayFiltros, ordenar } from "../logic/catalogo.js";
import { enOferta } from "../logic/precios.js";

/** Productos con descuento, de mayor a menor, con los mismos filtros del catalogo. */
export default function Ofertas() {
	useTitulo("Ofertas — Ensambla.me");
	const { productos, categorias } = useDatos();
	const { criterios, aplicar } = useCriterios("descuento");

	const enOfertas = productos.filter(enOferta);
	const lista = ordenar(filtrar(enOfertas, criterios), criterios.orden);

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Descuentos</p>
			<h1 className="h3">Ofertas</h1>

			{enOfertas.length ? (
				<>
					<FiltrosCatalogo
						criterios={criterios}
						aplicar={aplicar}
						categorias={categorias}
						conOferta={false}
						prefijo="oferta"
					/>
					<p className="text-secondary" aria-live="polite">
						{lista.length} de {enOfertas.length} {enOfertas.length === 1 ? "producto" : "productos"} en oferta.
					</p>
					<RejillaProductos
						productos={lista}
						nivel={2}
						mensajeVacio={
							hayFiltros(criterios)
								? "Ninguna oferta coincide con los filtros. Prueba con otra busqueda o limpia los filtros."
								: "No hay ofertas por ahora."
						}
					/>
				</>
			) : (
				<EstadoVacio>
					<p>Por ahora no hay productos en oferta.</p>
					<Link className="btn btn-primary" to="/productos">
						Ver el catalogo
					</Link>
				</EstadoVacio>
			)}
		</main>
	);
}

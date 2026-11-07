import FiltrosCatalogo from "../components/FiltrosCatalogo.jsx";
import RejillaProductos from "../components/RejillaProductos.jsx";
import { useDatos } from "../context/datos.js";
import { useCriterios } from "../hooks/useCriterios.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { filtrar, hayFiltros, ordenar } from "../logic/catalogo.js";

/** Catalogo completo, con busqueda y filtros (?q=, ?categoria=, ?min=, ?max=, ?oferta=, ?stock=, ?orden=) (RF-03). */
export default function Productos() {
	useTitulo("Productos — Ensambla.me");
	const { productos, categorias } = useDatos();
	const { criterios: pedidos, aplicar } = useCriterios();

	// Una categoria que no existe se ignora y se muestra todo el catalogo.
	const categoria = pedidos.categoria ? categorias.find((c) => c.codigo === pedidos.categoria) : null;
	const criterios = categoria ? pedidos : { ...pedidos, categoria: "" };
	const lista = ordenar(filtrar(productos, criterios), criterios.orden);
	const lugar = categoria ? `en ${categoria.nombre}` : "en el catalogo";

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Catalogo</p>
			<h1 className="h3">{categoria ? categoria.nombre : "Todos los productos"}</h1>

			<FiltrosCatalogo criterios={criterios} aplicar={aplicar} categorias={categorias} />

			<p className="text-secondary" aria-live="polite">
				{hayFiltros(criterios)
					? `${lista.length} ${lista.length === 1 ? "producto coincide" : "productos coinciden"} con tu busqueda.`
					: `${lista.length} productos ${lugar}.`}
			</p>

			<RejillaProductos
				productos={lista}
				nivel={2}
				mensajeVacio={
					hayFiltros(criterios)
						? "Ningun producto coincide con los filtros. Prueba con otra busqueda o limpia los filtros."
						: `No hay productos disponibles ${lugar}.`
				}
			/>
		</main>
	);
}

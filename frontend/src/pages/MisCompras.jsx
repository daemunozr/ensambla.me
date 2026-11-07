import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import TablaOrdenes from "../components/TablaOrdenes.jsx";
import { useDatos } from "../context/datos.js";
import { useSesion } from "../context/sesion.js";
import { totalOrden } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { precio } from "../utils/formato.js";

/** Historial de compras de quien tiene la sesion iniciada, con el acceso a cada boleta. */
export default function MisCompras() {
	useTitulo("Mis compras — Ensambla.me");
	const { sesion } = useSesion();
	const { ordenes } = useDatos();
	const suyas = ordenes.filter((orden) => orden.cliente === sesion?.run);
	const gastado = suyas.reduce((total, orden) => total + totalOrden(orden.numero), 0);

	return (
		<main>
			<p className="sobretitulo">Mi cuenta</p>
			<h1 className="h3">Mis compras</h1>

			{suyas.length ? (
				<>
					<p className="text-secondary">
						{suyas.length} {suyas.length === 1 ? "compra" : "compras"} por un total de {precio(gastado)}.
					</p>
					<TablaOrdenes
						ordenes={suyas}
						rutaDetalle={(numero) => `/mis-compras/${encodeURIComponent(numero)}`}
						titulo="Tus compras"
					/>
				</>
			) : (
				<EstadoVacio>
					<p className="mb-3">Todavia no has hecho compras con esta cuenta.</p>
					<Link className="btn btn-primary" to="/productos">
						Ver el catalogo
					</Link>
				</EstadoVacio>
			)}
		</main>
	);
}

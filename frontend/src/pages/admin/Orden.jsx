import { Link, useParams } from "react-router";
import Boleta from "../../components/Boleta.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import { itemsDeOrden, orden as buscarOrden } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";

/** Detalle de una orden en solo lectura: su boleta (RF-12 CA2). */
export default function Orden() {
	const { numero = "" } = useParams();
	const orden = buscarOrden(numero);
	useTitulo(orden ? `Orden ${orden.numero} — Panel Ensambla.me` : "Orden no encontrada — Panel Ensambla.me");

	if (!orden) {
		return (
			<main className="col-12 col-lg-9">
				<h1 className="h3">Orden no encontrada</h1>
				<EstadoVacio>
					<p>
						No existe una orden con el numero <strong>{numero || "(sin numero)"}</strong>.
					</p>
					<Link className="btn btn-primary" to="/admin/ordenes">
						Volver a las ordenes
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Consulta</p>
			<h1 className="h3">Orden {orden.numero}</h1>
			<p className="solo-lectura mb-4">Vista de solo lectura.</p>

			<Boleta orden={orden} items={itemsDeOrden(orden.numero)} />

			<p>
				<Link className="btn btn-outline-primary no-imprimir" to="/admin/ordenes">
					Volver a las ordenes
				</Link>
			</p>
		</main>
	);
}

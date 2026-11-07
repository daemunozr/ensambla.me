import { useState } from "react";
import CajaBusqueda from "../../components/CajaBusqueda.jsx";
import TablaOrdenes from "../../components/TablaOrdenes.jsx";
import { useDatos } from "../../context/datos.js";
import { itemsDeOrden, producto } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { coincide } from "../../logic/busqueda.js";

/** Listado de ordenes en solo lectura: cliente, fecha, productos y total (RF-12 CA2), con busqueda. */
export default function Ordenes() {
	useTitulo("Ordenes — Panel Ensambla.me");
	const { ordenes } = useDatos();
	const [busqueda, setBusqueda] = useState("");

	const visibles = ordenes.filter((orden) =>
		coincide(
			busqueda,
			orden.numero,
			orden.cliente,
			orden.nombre,
			orden.correo,
			...itemsDeOrden(orden.numero).map((item) => `${item.producto} ${producto(item.producto)?.nombre ?? ""}`),
		),
	);

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Consulta</p>
			<h1 className="h3">Ordenes</h1>
			<p className="solo-lectura mb-3">
				Vista de solo lectura. Las compras que se pagan en la tienda aparecen aqui al instante.
			</p>

			<CajaBusqueda
				id="busqueda-ordenes"
				placeholder="Numero, cliente, correo o producto"
				valor={busqueda}
				onCambio={setBusqueda}
				mostrados={visibles.length}
				total={ordenes.length}
			/>

			<TablaOrdenes
				ordenes={visibles}
				conCliente
				rutaDetalle={(numero) => `/admin/ordenes/${encodeURIComponent(numero)}`}
				mensajeVacio={ordenes.length ? "Ninguna orden coincide con la busqueda." : "No hay ordenes registradas."}
			/>
		</main>
	);
}

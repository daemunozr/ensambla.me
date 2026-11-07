import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Alerta, { ZonaAviso } from "../../components/Alerta.jsx";
import CajaBusqueda from "../../components/CajaBusqueda.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";
import PrecioProducto from "../../components/PrecioProducto.jsx";
import { useDatos } from "../../context/datos.js";
import { useSesion } from "../../context/sesion.js";
import { nombreCategoria } from "../../data/datos.js";
import { useEliminacion } from "../../hooks/useEliminacion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { coincide } from "../../logic/busqueda.js";
import { enStockCritico } from "../../logic/stock.js";
import { recurso } from "../../utils/recursos.js";

/** Fila del listado; la columna de acciones existe solo si se puede editar. */
function FilaProducto({ producto, puedeEditar, onEliminar }) {
	const critico = enStockCritico(producto);
	const sku = encodeURIComponent(producto.sku);

	return (
		<tr className={critico ? "fila-stock-critico" : undefined}>
			<td>{producto.imagen && <img src={recurso(producto.imagen)} alt="" className="miniatura" loading="lazy" />}</td>
			<td>
				<code>{producto.sku}</code>
			</td>
			<td>
				<Link className="enlace-producto" to={`/productos/${sku}`}>
					{producto.nombre}
				</Link>
			</td>
			<td>{nombreCategoria(producto.categoria)}</td>
			<td className="text-end">
				<PrecioProducto producto={producto} />
			</td>
			<td className="text-end">{producto.stock}</td>
			<td className="text-end">{producto.stockCritico === "" ? "—" : producto.stockCritico}</td>
			<td>{critico && <span className="alerta-stock">Stock critico</span>}</td>
			{puedeEditar && (
				<td className="text-end text-nowrap">
					<Link className="btn btn-sm btn-outline-primary" to={`/admin/productos/${sku}/editar`}>
						Editar
					</Link>{" "}
					<button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onEliminar(producto)}>
						Eliminar
					</button>
				</td>
			)}
		</tr>
	);
}

/**
 * Listado de productos (RF-10): crear, editar y eliminar, con alerta de stock
 * critico. El rol Administrador logistico lo ve en solo lectura (RF-12 CA1).
 */
export default function Productos() {
	useTitulo("Productos — Panel Ensambla.me");
	const { sesion } = useSesion();
	const { productos, eliminarProducto } = useDatos();
	const [parametros] = useSearchParams();
	const puedeEditar = sesion?.rol === "ADMIN";
	const guardado = parametros.get("guardado");
	const [busqueda, setBusqueda] = useState("");
	const visibles = productos.filter((p) => coincide(busqueda, p.sku, p.nombre, nombreCategoria(p.categoria)));

	const eliminacion = useEliminacion(useCallback((producto) => eliminarProducto(producto.sku), [eliminarProducto]));

	return (
		<main className="col-12 col-lg-9">
			<div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
				<div>
					<p className="sobretitulo">Mantenedor</p>
					<h1 className="h3 mb-0">Productos</h1>
					<p className="solo-lectura mb-0">
						{productos.length} productos en el catalogo.{puedeEditar ? "" : " Vista de solo lectura."}
					</p>
				</div>
				<div className="d-flex flex-wrap gap-2">
					<Link className="btn btn-outline-primary" to="/admin/productos/criticos">
						Productos criticos
					</Link>
					{puedeEditar && (
						<Link className="btn btn-outline-primary" to="/admin/reportes">
							Reportes
						</Link>
					)}
					{puedeEditar && (
						<Link className="btn btn-primary" to="/admin/productos/nuevo">
							Nuevo producto
						</Link>
					)}
				</div>
			</div>

			{eliminacion.aviso ? (
				<ZonaAviso aviso={eliminacion.aviso} />
			) : (
				<div aria-live="polite">
					{guardado && (
						<Alerta>
							El producto <strong>{guardado}</strong> se guardo correctamente.
						</Alerta>
					)}
				</div>
			)}

			<CajaBusqueda
				id="busqueda-productos"
				placeholder="Codigo, nombre o categoria"
				valor={busqueda}
				onCambio={setBusqueda}
				mostrados={visibles.length}
				total={productos.length}
			/>

			<div className="table-responsive">
				{visibles.length ? (
					<table className="table table-hover tabla-admin align-middle">
						<caption className="visually-hidden">Listado de productos del catalogo</caption>
						<thead>
							<tr>
								<th scope="col">Imagen</th>
								<th scope="col">Codigo</th>
								<th scope="col">Nombre</th>
								<th scope="col">Categoria</th>
								<th scope="col" className="text-end">Precio</th>
								<th scope="col" className="text-end">Stock</th>
								<th scope="col" className="text-end">Critico</th>
								<th scope="col">Alerta</th>
								{puedeEditar && <th scope="col" className="text-end">Acciones</th>}
							</tr>
						</thead>
						<tbody>
							{visibles.map((producto) => (
								<FilaProducto
									key={producto.sku}
									producto={producto}
									puedeEditar={puedeEditar}
									onEliminar={eliminacion.pedir}
								/>
							))}
						</tbody>
					</table>
				) : (
					<EstadoVacio>
						<p className="mb-0">
							{productos.length ? "Ningun producto coincide con la busqueda." : "No hay productos cargados."}
						</p>
					</EstadoVacio>
				)}
			</div>

			<ModalConfirmacion
				abierto={Boolean(eliminacion.pendiente)}
				titulo="Eliminar producto"
				onConfirmar={eliminacion.confirmar}
				onCancelar={eliminacion.cancelar}
			>
				<p>
					Se eliminara <strong>{eliminacion.pendiente?.nombre}</strong> ({eliminacion.pendiente?.sku}) del
					catalogo. Las ordenes que lo incluyen conservan su detalle.
				</p>
				<p className="mb-0">Esta accion no se puede deshacer.</p>
			</ModalConfirmacion>
		</main>
	);
}

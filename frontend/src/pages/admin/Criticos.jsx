import { Link } from "react-router";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import { useDatos } from "../../context/datos.js";
import { useSesion } from "../../context/sesion.js";
import { nombreCategoria } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { faltante, productosCriticos } from "../../logic/stock.js";
import { recurso } from "../../utils/recursos.js";

/** Productos en stock critico, del mas urgente al menos. Quien puede editar productos ve el acceso a su ficha. */
export default function Criticos() {
	useTitulo("Productos criticos — Panel Ensambla.me");
	const { sesion } = useSesion();
	const { productos } = useDatos();
	const puedeEditar = sesion?.rol === "ADMIN";
	const criticos = productosCriticos(productos);

	return (
		<main className="col-12 col-lg-9">
			<div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
				<div>
					<p className="sobretitulo">Inventario</p>
					<h1 className="h3 mb-0">Productos criticos</h1>
					<p className="solo-lectura mb-0" aria-live="polite">
						{criticos.length === 1
							? "1 producto con stock bajo o igual a su umbral."
							: `${criticos.length} productos con stock bajo o igual a su umbral.`}
					</p>
				</div>
				<Link className="btn btn-outline-primary" to="/admin/productos">
					Volver a productos
				</Link>
			</div>

			{criticos.length ? (
				<div className="table-responsive">
					<table className="table table-hover tabla-admin align-middle">
						<caption className="visually-hidden">Productos en stock critico, del mas urgente al menos</caption>
						<thead>
							<tr>
								<th scope="col">Imagen</th>
								<th scope="col">Codigo</th>
								<th scope="col">Nombre</th>
								<th scope="col">Categoria</th>
								<th scope="col" className="text-end">Stock</th>
								<th scope="col" className="text-end">Critico</th>
								<th scope="col" className="text-end">Faltan</th>
								<th scope="col">Estado</th>
								{puedeEditar && <th scope="col" className="text-end">Acciones</th>}
							</tr>
						</thead>
						<tbody>
							{criticos.map((producto) => (
								<tr key={producto.sku} className="fila-stock-critico">
									<td>
										{producto.imagen && (
											<img src={recurso(producto.imagen)} alt="" className="miniatura" loading="lazy" />
										)}
									</td>
									<td>
										<code>{producto.sku}</code>
									</td>
									<td>
										<Link className="enlace-producto" to={`/productos/${encodeURIComponent(producto.sku)}`}>
											{producto.nombre}
										</Link>
									</td>
									<td>{nombreCategoria(producto.categoria)}</td>
									<td className="text-end">{producto.stock}</td>
									<td className="text-end">{producto.stockCritico}</td>
									<td className="text-end">{faltante(producto)}</td>
									<td>
										<span className="alerta-stock">{Number(producto.stock) <= 0 ? "Sin stock" : "Stock critico"}</span>
									</td>
									{puedeEditar && (
										<td className="text-end">
											<Link
												className="btn btn-sm btn-outline-primary"
												to={`/admin/productos/${encodeURIComponent(producto.sku)}/editar`}
											>
												Editar
											</Link>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<EstadoVacio>
					<p className="mb-0">Ningun producto esta en stock critico.</p>
				</EstadoVacio>
			)}
		</main>
	);
}

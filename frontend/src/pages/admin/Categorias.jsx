import { useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import Alerta, { ZonaAviso } from "../../components/Alerta.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";
import { useDatos } from "../../context/datos.js";
import { useEliminacion } from "../../hooks/useEliminacion.js";
import { useTitulo } from "../../hooks/useTitulo.js";

/**
 * Mantenedor de categorias: listar, crear, renombrar y eliminar. La capa de
 * datos impide eliminar una categoria con productos o una del asistente.
 */
export default function Categorias() {
	useTitulo("Categorias — Panel Ensambla.me");
	const { categorias, productos, eliminarCategoria } = useDatos();
	const [parametros] = useSearchParams();
	const guardada = parametros.get("guardada");

	const eliminacion = useEliminacion(useCallback((categoria) => eliminarCategoria(categoria.codigo), [eliminarCategoria]));
	const cantidadDe = (codigo) => productos.filter((p) => p.categoria === codigo).length;

	return (
		<main className="col-12 col-lg-9">
			<div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
				<div>
					<p className="sobretitulo">Mantenedor</p>
					<h1 className="h3 mb-0">Categorias</h1>
					<p className="solo-lectura mb-0">{categorias.length} categorias en el catalogo.</p>
				</div>
				<Link className="btn btn-primary" to="/admin/categorias/nueva">
					Nueva categoria
				</Link>
			</div>

			{eliminacion.aviso ? (
				<ZonaAviso aviso={eliminacion.aviso} />
			) : (
				<div aria-live="polite">
					{guardada && (
						<Alerta>
							La categoria <strong>{guardada}</strong> se guardo correctamente.
						</Alerta>
					)}
				</div>
			)}

			<div className="table-responsive">
				{categorias.length ? (
					<table className="table table-hover tabla-admin align-middle">
						<caption className="visually-hidden">Listado de categorias del catalogo</caption>
						<thead>
							<tr>
								<th scope="col">Codigo</th>
								<th scope="col">Nombre</th>
								<th scope="col" className="text-end">Paso del asistente</th>
								<th scope="col" className="text-end">Productos</th>
								<th scope="col" className="text-end">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{categorias.map((categoria) => (
								<tr key={categoria.codigo}>
									<td>
										<code>{categoria.codigo}</code>
									</td>
									<td>
										<Link
											className="enlace-producto"
											to={`/productos?categoria=${encodeURIComponent(categoria.codigo)}`}
										>
											{categoria.nombre}
										</Link>
									</td>
									<td className="text-end">{categoria.orden ?? "—"}</td>
									<td className="text-end">{cantidadDe(categoria.codigo)}</td>
									<td className="text-end text-nowrap">
										<Link
											className="btn btn-sm btn-outline-primary"
											to={`/admin/categorias/${encodeURIComponent(categoria.codigo)}/editar`}
										>
											Editar
										</Link>{" "}
										<button
											type="button"
											className="btn btn-sm btn-outline-danger"
											onClick={() => eliminacion.pedir(categoria)}
										>
											Eliminar
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<EstadoVacio>
						<p className="mb-0">No hay categorias cargadas.</p>
					</EstadoVacio>
				)}
			</div>

			<ModalConfirmacion
				abierto={Boolean(eliminacion.pendiente)}
				titulo="Eliminar categoria"
				onConfirmar={eliminacion.confirmar}
				onCancelar={eliminacion.cancelar}
			>
				<p>
					Se eliminara la categoria <strong>{eliminacion.pendiente?.nombre}</strong> (
					{eliminacion.pendiente?.codigo}). Solo es posible si no tiene productos y no es un paso del asistente
					de armado.
				</p>
				<p className="mb-0">Esta accion no se puede deshacer.</p>
			</ModalConfirmacion>
		</main>
	);
}

import { useMemo, useState } from "react";
import { Link } from "react-router";
import Campo from "../../components/Campo.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import Indicador from "../../components/Indicador.jsx";
import TablaBarras from "../../components/TablaBarras.jsx";
import { useDatos } from "../../context/datos.js";
import { nombreCategoria } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import {
	filtrarPorFecha,
	resumenVentas,
	topClientes,
	topProductos,
	valorInventario,
	ventasPorCategoria,
	ventasPorMes,
} from "../../logic/reportes.js";
import { enStockCritico } from "../../logic/stock.js";
import { mesLegible, precio } from "../../utils/formato.js";

const plural = (n, singular, varios) => `${n} ${n === 1 ? singular : varios}`;

/** Reportes de ventas e inventario, con filtro por rango de fechas. */
export default function Reportes() {
	useTitulo("Reportes — Panel Ensambla.me");
	const { ordenes, itemsOrden, productos } = useDatos();
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");

	const invertido = Boolean(desde && hasta && desde > hasta);
	const reporte = useMemo(() => {
		const buscar = (sku) => productos.find((producto) => producto.sku === sku);
		const filtradas = filtrarPorFecha(ordenes, { desde, hasta });
		return {
			resumen: resumenVentas(filtradas, itemsOrden),
			meses: ventasPorMes(filtradas, itemsOrden),
			categorias: ventasPorCategoria(filtradas, itemsOrden, buscar),
			masVendidos: topProductos(filtradas, itemsOrden, buscar),
			clientes: topClientes(filtradas, itemsOrden),
		};
	}, [ordenes, itemsOrden, productos, desde, hasta]);
	const inventario = valorInventario(productos);
	const criticos = productos.filter(enStockCritico).length;
	const { resumen } = reporte;

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Analisis</p>
			<h1 className="h3">Reportes</h1>
			<p className="text-secondary">Ventas del periodo e inventario actual. Las cifras incluyen IVA.</p>

			<section className="tarjeta-formulario p-3 mb-4" aria-labelledby="reportes-periodo">
				<h2 className="h6" id="reportes-periodo">
					Periodo
				</h2>
				<div className="row g-3 align-items-end">
					<Campo
						className="col-6 col-md-4"
						id="reporte-desde"
						etiqueta="Desde"
						type="date"
						autoComplete="off"
						value={desde}
						onChange={(evento) => setDesde(evento.target.value)}
					/>
					<Campo
						className="col-6 col-md-4"
						id="reporte-hasta"
						etiqueta="Hasta"
						type="date"
						autoComplete="off"
						value={hasta}
						onChange={(evento) => setHasta(evento.target.value)}
					/>
					<div className="col-12 col-md-4">
						<button
							type="button"
							className="btn btn-outline-secondary"
							onClick={() => {
								setDesde("");
								setHasta("");
							}}
						>
							Limpiar periodo
						</button>
					</div>
				</div>
				{invertido && (
					<p className="text-warning small mt-2 mb-0" role="alert">
						La fecha inicial no puede ser posterior a la final: no hay ordenes en ese rango.
					</p>
				)}
			</section>

			<div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
				<Indicador titulo="Ingresos" valor={precio(resumen.ingresos)} nota={`${precio(resumen.envios)} en envios`} />
				<Indicador titulo="Ordenes" valor={resumen.ordenes} nota="En el periodo" />
				<Indicador titulo="Ticket promedio" valor={precio(resumen.ticketPromedio)} nota="Por orden" />
				<Indicador titulo="Unidades vendidas" valor={resumen.unidades} nota="Sin contar envios" />
			</div>

			{resumen.ordenes === 0 ? (
				<EstadoVacio>
					<p className="mb-0">No hay ordenes en el periodo elegido.</p>
				</EstadoVacio>
			) : (
				<>
					<section className="mb-4" aria-labelledby="reporte-meses">
						<h2 className="h5" id="reporte-meses">
							Ventas por mes
						</h2>
						<TablaBarras
							titulo="Ingresos por mes"
							columna="Mes"
							filas={reporte.meses.map((mes) => ({
								clave: mes.mes,
								etiqueta: mesLegible(mes.mes),
								detalle: plural(mes.ordenes, "orden", "ordenes"),
								valor: mes.ingresos,
								valorTexto: precio(mes.ingresos),
							}))}
						/>
					</section>

					<section className="mb-4" aria-labelledby="reporte-categorias">
						<h2 className="h5" id="reporte-categorias">
							Ventas por categoria
						</h2>
						<TablaBarras
							titulo="Ingresos por categoria, sin contar envios"
							columna="Categoria"
							filas={reporte.categorias.map((fila) => ({
								clave: fila.categoria || "sin-categoria",
								etiqueta: fila.categoria ? nombreCategoria(fila.categoria) : "Sin categoria",
								detalle: plural(fila.unidades, "unidad", "unidades"),
								valor: fila.ingresos,
								valorTexto: precio(fila.ingresos),
							}))}
						/>
						{reporte.categorias.some((fila) => !fila.categoria) && (
							<p className="small text-secondary">
								«Sin categoria» reune productos vendidos que ya no estan en el catalogo.
							</p>
						)}
					</section>

					<section className="mb-4" aria-labelledby="reporte-productos">
						<h2 className="h5" id="reporte-productos">
							Productos mas vendidos
						</h2>
						<TablaBarras
							titulo="Los cinco productos con mas unidades vendidas"
							columna="Producto"
							filas={reporte.masVendidos.map((fila) => ({
								clave: fila.producto,
								etiqueta: fila.nombre || "Producto fuera del catalogo",
								detalle: `${fila.producto} · ${precio(fila.ingresos)}`,
								valor: fila.unidades,
								valorTexto: plural(fila.unidades, "unidad", "unidades"),
							}))}
						/>
					</section>

					<section className="mb-4" aria-labelledby="reporte-clientes">
						<h2 className="h5" id="reporte-clientes">
							Mejores clientes
						</h2>
						<TablaBarras
							titulo="Los cinco clientes que mas gastaron"
							columna="Cliente"
							filas={reporte.clientes.map((fila) => ({
								clave: fila.clave,
								etiqueta: fila.nombre,
								detalle: `${fila.cliente ? `RUN ${fila.cliente}` : "Invitado"} · ${plural(fila.ordenes, "orden", "ordenes")}`,
								valor: fila.gasto,
								valorTexto: precio(fila.gasto),
							}))}
						/>
					</section>
				</>
			)}

			<section className="mb-4" aria-labelledby="reporte-inventario">
				<h2 className="h5" id="reporte-inventario">
					Inventario
				</h2>
				<div className="row row-cols-1 row-cols-sm-3 g-3">
					<Indicador titulo="Valor del inventario" valor={precio(inventario.valor)} nota="A precio de lista" />
					<Indicador titulo="Unidades en stock" valor={inventario.unidades} nota={`${inventario.productos} productos`} />
					<Indicador titulo="En stock critico" valor={criticos} nota="Requieren reposicion" />
				</div>
				<p className="mt-3">
					<Link to="/admin/productos/criticos">Ver los productos criticos</Link>
				</p>
			</section>
		</main>
	);
}

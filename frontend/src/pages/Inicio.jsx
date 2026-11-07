import { Link } from "react-router";
import RejillaProductos from "../components/RejillaProductos.jsx";
import { useDatos } from "../context/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { recurso } from "../utils/recursos.js";

const DESTACADOS = ["CPU-R7-7800X3D", "GPU-RTX4070S", "MB-X670-ELITE", "RAM-DDR5-32-6000", "SSD-NVME-1TB", "PER-MONITOR-27"];

const PASOS = [
	{
		titulo: "Elige el procesador",
		texto: "Es la pieza que define el socket y, con ello, las placas madre que puedes usar.",
	},
	{
		titulo: "Avanza categoria por categoria",
		texto:
			"En cada paso el asistente lista solo los componentes asociados a tu eleccion anterior en la tabla de compatibilidad del catalogo.",
	},
	{
		titulo: "Agrega el conjunto al carrito",
		texto: "El armado entra como un conjunto, con el detalle de sus componentes y el precio sumado de todos ellos.",
	},
];

/** Inicio: componente principal, productos destacados y video del asistente (RNF-08 CA2). */
export default function Inicio() {
	useTitulo("Ensambla.me — Arma tu PC gamer pieza por pieza");

	const { productos } = useDatos();
	const destacados = DESTACADOS.map((sku) => productos.find((p) => p.sku === sku)).filter(Boolean);
	// Si los SKU destacados ya no existen, se muestran los primeros del catalogo.
	const lista = destacados.length ? destacados : productos.slice(0, 6);
	const video = recurso("resources/video/ensamblame.mp4");

	return (
		<main className="col-12 col-lg-9">
			<section className="portada mb-5">
				<div className="row align-items-center g-4">
					<div className="col-12 col-md-6 order-md-2">
						<img
							src={recurso("resources/img/hero.svg")}
							alt="Ilustracion de un PC gamer armado junto a su monitor"
							className="img-fluid"
						/>
					</div>
					<div className="col-12 col-md-6 order-md-1">
						<p className="sobretitulo">Tienda y asistente de armado</p>
						<h1 className="display-6">
							Arma tu PC gamer <span className="destacado">pieza por pieza</span>
						</h1>
						<p className="lead">
							Componentes con garantia oficial y un asistente que te ofrece solo lo compatible con lo que ya
							elegiste. Llevate el equipo completo o solo el modulo que te falta.
						</p>
						<div className="d-flex flex-wrap gap-2">
							<Link className="btn btn-primary btn-lg" to="/armado">
								Armar mi PC
							</Link>
							<Link className="btn btn-outline-primary btn-lg" to="/productos">
								Ver el catalogo
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section className="mb-5">
				<h2 className="h4 titulo-seccion mb-3">Productos destacados</h2>
				<RejillaProductos productos={lista} mensajeVacio="No hay productos disponibles por ahora." />
			</section>

			<section className="mb-5">
				<h2 className="h4 titulo-seccion mb-3">Mira el armado guiado en accion</h2>
				<p className="text-secondary">
					Un video corto del asistente de armado. Antes de comprar, revisa como se elige cada pieza y como el
					armado llega al carrito.
				</p>
				<video className="video-producto" controls preload="metadata" width="1280" height="720">
					<source src={video} type="video/mp4" />
					Tu navegador no puede reproducir este video. <a href={video}>Descargalo aqui</a>.
				</video>
			</section>

			<section>
				<h2 className="h4 titulo-seccion mb-3">Como funciona el armado guiado</h2>
				<div className="row row-cols-1 row-cols-md-3 g-3">
					{PASOS.map((paso, i) => (
						<div className="col" key={paso.titulo}>
							<article className="card h-100">
								<div className="card-body">
									<p className="sobretitulo mb-1">Paso {i + 1}</p>
									<h3 className="h6 card-title">{paso.titulo}</h3>
									<p className="card-text small mb-0">{paso.texto}</p>
								</div>
							</article>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}

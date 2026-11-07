import { useTitulo } from "../hooks/useTitulo.js";

/** Informacion institucional de la empresa y de quien desarrolla el sitio (RF-15). */
export default function Nosotros() {
	useTitulo("Nosotros — Ensambla.me");

	return (
		<main>
			<p className="sobretitulo">Quienes somos</p>
			<h1 className="h3">Nosotros</h1>

			<section className="mb-5">
				<p className="lead">
					Ensambla.me es una tienda online chilena de componentes de computacion que nacio de una
					pregunta repetida en el mostrador: <em>"y esto, me sirve con lo que ya tengo?"</em>.
				</p>
				<p>
					En vez de responderla caso a caso, armamos un catalogo donde cada componente sabe con que
					otros se lleva. Sobre esa base construimos un asistente de armado que acompana al cliente
					categoria por categoria —procesador, placa madre, memoria, almacenamiento, fuente,
					gabinete, refrigeracion, tarjeta grafica y perifericos— y le ofrece en cada paso solo las
					piezas asociadas a lo que ya eligio.
				</p>
				<p>
					Vendemos piezas sueltas, modulos (por ejemplo solo almacenamiento) y equipos completos.
					Trabajamos con garantia oficial del fabricante y despacho a todo Chile.
				</p>
			</section>

			<section className="mb-5">
				<h2 className="h4 titulo-seccion mb-3">En que creemos</h2>
				<div className="row row-cols-1 row-cols-md-3 g-3">
					<div className="col">
						<article className="dato-empresa h-100 p-3">
							<p className="cifra mb-1">1</p>
							<h3 className="h6">Nadie compra a ciegas</h3>
							<p className="small mb-0">
								Cada ficha dice que es la pieza, para que sirve y con que combina.
							</p>
						</article>
					</div>
					<div className="col">
						<article className="dato-empresa h-100 p-3">
							<p className="cifra mb-1">2</p>
							<h3 className="h6">Se puede ir por partes</h3>
							<p className="small mb-0">
								Mejorar el equipo de a poco es tan valido como armarlo de una vez.
							</p>
						</article>
					</div>
					<div className="col">
						<article className="dato-empresa h-100 p-3">
							<p className="cifra mb-1">3</p>
							<h3 className="h6">El precio se explica</h3>
							<p className="small mb-0">
								Mostramos el detalle de cada armado y la suma de sus componentes, sin sorpresas.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section>
				<h2 className="h4 titulo-seccion mb-3">Quien desarrolla el sitio</h2>
				<div className="row row-cols-1 row-cols-md-2 g-3">
					<div className="col">
						<article className="card tarjeta-persona h-100">
							<div className="card-body d-flex gap-3">
								<p className="inicial mb-0" aria-hidden="true">DM</p>
								<div>
									<h3 className="h6 mb-1">Daniel Munoz</h3>
									<p className="etiqueta-categoria mb-2">Desarrollo frontend y modelo de datos</p>
									<p className="small mb-0">
										Estudiante de Ingenieria en Informatica de Duoc UC. Responsable del diseno de
										las vistas, de la hoja de estilos, de las validaciones en JavaScript y del
										modelo logico de la informacion del proyecto.
									</p>
								</div>
							</div>
						</article>
					</div>
				</div>
			</section>
		</main>
	);
}

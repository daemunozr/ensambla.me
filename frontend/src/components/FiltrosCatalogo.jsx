import { useState } from "react";
import { ORDENES, aParametros } from "../logic/catalogo.js";
import Campo from "./Campo.jsx";

/** Valores del formulario (texto) a partir de los criterios leidos de la URL. */
const desdeCriterios = (criterios) => ({
	q: criterios.q,
	categoria: criterios.categoria,
	min: criterios.min ?? "",
	max: criterios.max ?? "",
	oferta: criterios.oferta,
	stock: criterios.stock,
	orden: criterios.orden,
});

/**
 * Busqueda y filtros del catalogo. El texto y los precios se aplican al enviar
 * el formulario; la categoria, el orden y las casillas, al cambiarlos. Los
 * criterios viven en la URL (aplicar) y, si esta cambia desde afuera (Atras, la
 * busqueda del menu, Limpiar), el formulario se actualiza con ella.
 */
export default function FiltrosCatalogo({ criterios, aplicar, categorias, conOferta = true, prefijo = "filtro" }) {
	const [valores, setValores] = useState(() => desdeCriterios(criterios));
	const firma = aParametros(criterios).toString();
	const [firmaAplicada, setFirmaAplicada] = useState(firma);
	if (firma !== firmaAplicada) {
		setFirmaAplicada(firma);
		setValores(desdeCriterios(criterios));
	}

	const leer = (evento) => (evento.target.type === "checkbox" ? evento.target.checked : evento.target.value);
	const cambiar = (campo) => (evento) => setValores((actuales) => ({ ...actuales, [campo]: leer(evento) }));
	const cambiarYAplicar = (campo) => (evento) => {
		const nuevos = { ...valores, [campo]: leer(evento) };
		setValores(nuevos);
		aplicar(nuevos);
	};

	const rangoInvertido = valores.min !== "" && valores.max !== "" && Number(valores.min) > Number(valores.max);

	return (
		<form
			className="tarjeta-formulario p-3 mb-3"
			role="search"
			aria-label="Busqueda y filtros del catalogo"
			noValidate
			onSubmit={(evento) => {
				evento.preventDefault();
				aplicar(valores);
			}}
		>
			<div className="row g-3">
				<Campo
					className="col-12 col-md-6"
					id={`${prefijo}-q`}
					etiqueta="Buscar"
					type="search"
					name="q"
					maxLength={100}
					autoComplete="off"
					placeholder="Nombre, codigo o descripcion"
					value={valores.q}
					onChange={cambiar("q")}
				/>
				<Campo
					como="select"
					className="col-6 col-md-3"
					id={`${prefijo}-categoria`}
					etiqueta="Categoria"
					name="categoria"
					autoComplete="off"
					value={valores.categoria}
					onChange={cambiarYAplicar("categoria")}
				>
					<option value="">Todas</option>
					{categorias.map((categoria) => (
						<option key={categoria.codigo} value={categoria.codigo}>
							{categoria.nombre}
						</option>
					))}
				</Campo>
				<Campo
					como="select"
					className="col-6 col-md-3"
					id={`${prefijo}-orden`}
					etiqueta="Ordenar por"
					name="orden"
					autoComplete="off"
					value={valores.orden}
					onChange={cambiarYAplicar("orden")}
				>
					{ORDENES.map((orden) => (
						<option key={orden.valor} value={orden.valor}>
							{orden.texto}
						</option>
					))}
				</Campo>
				<Campo
					className="col-6 col-md-3"
					id={`${prefijo}-min`}
					etiqueta="Precio minimo"
					type="number"
					name="min"
					min="0"
					step="1"
					inputMode="numeric"
					autoComplete="off"
					value={valores.min}
					onChange={cambiar("min")}
				/>
				<Campo
					className="col-6 col-md-3"
					id={`${prefijo}-max`}
					etiqueta="Precio maximo"
					type="number"
					name="max"
					min="0"
					step="1"
					inputMode="numeric"
					autoComplete="off"
					value={valores.max}
					onChange={cambiar("max")}
				/>
				<div className="col-12 col-md-6 d-flex flex-wrap align-items-end gap-3">
					{conOferta && (
						<div className="form-check mb-2">
							<input
								className="form-check-input"
								type="checkbox"
								id={`${prefijo}-oferta`}
								name="oferta"
								checked={valores.oferta}
								onChange={cambiarYAplicar("oferta")}
							/>
							<label className="form-check-label" htmlFor={`${prefijo}-oferta`}>
								Solo ofertas
							</label>
						</div>
					)}
					<div className="form-check mb-2">
						<input
							className="form-check-input"
							type="checkbox"
							id={`${prefijo}-stock`}
							name="stock"
							checked={valores.stock}
							onChange={cambiarYAplicar("stock")}
						/>
						<label className="form-check-label" htmlFor={`${prefijo}-stock`}>
							Solo con stock
						</label>
					</div>
				</div>
			</div>

			{rangoInvertido && (
				<p className="text-warning small mt-2 mb-0" role="alert">
					El precio minimo no puede superar al maximo.
				</p>
			)}

			<div className="d-flex flex-wrap gap-2 mt-3">
				<button type="submit" className="btn btn-primary">
					Aplicar
				</button>
				<button type="button" className="btn btn-outline-secondary" onClick={() => aplicar({})}>
					Limpiar filtros
				</button>
			</div>
		</form>
	);
}

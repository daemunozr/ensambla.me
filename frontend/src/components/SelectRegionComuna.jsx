import Campo from "./Campo.jsx";
import { comunasDe, regiones } from "../data/datos.js";

/**
 * Selects de region y comuna: al cambiar la region se recargan solo sus
 * comunas y se descarta la comuna anterior (RF-01 CA5).
 *
 * formulario es el objeto de useFormulario; prefijo arma los id de los campos.
 */
export default function SelectRegionComuna({ formulario, prefijo, className = "col-12 col-md-4" }) {
	const { registrar, estado, errores, asignar, valores } = formulario;
	const region = registrar("region");

	return (
		<>
			<Campo
				como="select"
				className={className}
				id={`${prefijo}-region`}
				etiqueta="Region"
				obligatorio
				autoComplete="address-level1"
				sugerencia="Al cambiarla se recargan sus comunas."
				error={errores.region}
				estado={estado("region")}
				{...region}
				onChange={(evento) => {
					region.onChange(evento);
					asignar({ comuna: "" });
				}}
			>
				<option value="">Selecciona una region</option>
				{regiones.map((r) => (
					<option key={r.codigo} value={r.codigo}>
						{r.nombre}
					</option>
				))}
			</Campo>

			<Campo
				como="select"
				className={className}
				id={`${prefijo}-comuna`}
				etiqueta="Comuna"
				obligatorio
				autoComplete="address-level2"
				sugerencia="Solo las comunas de la region escogida."
				error={errores.comuna}
				estado={estado("comuna")}
				{...registrar("comuna")}
			>
				<option value="">Selecciona una comuna</option>
				{comunasDe(valores.region).map((c) => (
					<option key={c.codigo} value={c.codigo}>
						{c.nombre}
					</option>
				))}
			</Campo>
		</>
	);
}

import Campo from "./Campo.jsx";
import { sugerenciasDeCorreo } from "../utils/validaciones.js";

/**
 * Campo de correo que ofrece los dominios permitidos como sugerencia
 * seleccionable, completando lo que ya se escribio (RF-01 CA8).
 */
export default function CampoCorreo({ id, value, ...props }) {
	const lista = `dominios-${id}`;
	return (
		<>
			<Campo id={id} type="email" maxLength={100} list={lista} value={value} {...props} />
			<datalist id={lista}>
				{sugerenciasDeCorreo(value).map((opcion) => (
					<option key={opcion} value={opcion} />
				))}
			</datalist>
		</>
	);
}

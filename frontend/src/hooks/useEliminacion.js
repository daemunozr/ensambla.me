/*
 * Flujo de eliminacion de los mantenedores: pedir (abre la confirmacion),
 * confirmar (ejecuta la operacion, que es asincrona porque llama a la API) o cancelar. El resultado queda como aviso
 * de exito o de rechazo para la zona aria-live del listado.
 */
import { useCallback, useState } from "react";

export function useEliminacion(eliminar) {
	const [pendiente, setPendiente] = useState(null);
	const [aviso, setAviso] = useState(null);

	const pedir = useCallback((registro) => setPendiente(registro), []);
	const cancelar = useCallback(() => setPendiente(null), []);

	const confirmar = useCallback(async () => {
		const resultado = await eliminar(pendiente);
		setAviso({ tipo: resultado.ok ? "success" : "danger", contenido: resultado.mensaje });
		setPendiente(null);
	}, [eliminar, pendiente]);

	return { pendiente, aviso, pedir, cancelar, confirmar };
}

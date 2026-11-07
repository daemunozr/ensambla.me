/** Una ruta guardada en los datos es externa si trae esquema, es // o un ancla. */
export const esExterna = (ruta) => /^([a-z]+:|\/\/|#)/i.test(ruta);

/**
 * Resuelve una imagen o un video guardados como ruta relativa a public/
 * ("resources/img/cpu.svg") o como URL completa.
 */
export function recurso(ruta) {
	if (!ruta) return "";
	if (esExterna(ruta) || ruta.startsWith("/")) return ruta;
	return `${import.meta.env.BASE_URL}${ruta}`;
}

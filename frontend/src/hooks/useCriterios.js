/*
 * Criterios de busqueda y filtro del catalogo, guardados en la URL.
 * aplicar recibe valores de formulario y reemplaza todos los criterios.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { aParametros, leerCriterios } from "../logic/catalogo.js";

export function useCriterios(ordenInicial = "") {
	const [parametros, setParametros] = useSearchParams();
	const criterios = useMemo(() => leerCriterios(parametros, ordenInicial), [parametros, ordenInicial]);
	const aplicar = useCallback((valores) => setParametros(aParametros(valores)), [setParametros]);

	return { criterios, aplicar };
}

import { useEffect } from "react";

/** Titulo de la pestana para la vista actual. */
export function useTitulo(titulo) {
	useEffect(() => {
		document.title = titulo;
	}, [titulo]);
}

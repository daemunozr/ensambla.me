/*
 * Estado y validacion en tiempo real de un formulario (RNF-02 CA4).
 *
 * Cada campo se valida al escribir (o al cambiar, en select y fecha) y al
 * perder el foco, igual que el resto del sitio: el error aparece junto al
 * campo antes de pulsar el boton de envio. Al enviar se validan todos y se
 * enfoca el primero invalido.
 */
import { useCallback, useState } from "react";
import { validar, validarValor } from "../utils/validaciones.js";

export function useFormulario(inicial, definicion) {
	const [valores, setValores] = useState(inicial);
	const [errores, setErrores] = useState({});

	const validarCampo = useCallback(
		(nombre, valor) => setErrores((actuales) => ({ ...actuales, [nombre]: validarValor(valor, definicion[nombre]) })),
		[definicion],
	);

	/** Cambia valores sin pasar por un evento (por ejemplo, al recargar comunas). */
	const asignar = useCallback((cambios) => setValores((actuales) => ({ ...actuales, ...cambios })), []);

	/** Props de un control: name, value, onChange, onBlur y aria-invalid. */
	const registrar = (nombre) => ({
		name: nombre,
		value: valores[nombre] ?? "",
		onChange: (evento) => {
			const valor = evento.target.value;
			setValores((actuales) => ({ ...actuales, [nombre]: valor }));
			if (nombre in definicion) validarCampo(nombre, valor);
		},
		onBlur: (evento) => {
			if (nombre in definicion) validarCampo(nombre, evento.target.value);
		},
	});

	/**
	 * Estado visual del campo: "" si no se ha validado, "is-invalid" con error o
	 * "is-valid" si paso y tiene contenido.
	 */
	const estado = (nombre) => {
		if (!(nombre in errores)) return "";
		if (errores[nombre]) return "is-invalid";
		return String(valores[nombre] ?? "").trim() !== "" ? "is-valid" : "";
	};

	/** Manejador de submit: llama a alEnviar con los valores recortados si todo es valido. */
	const enviar = (alEnviar) => (evento) => {
		evento.preventDefault();
		const formulario = evento.currentTarget;
		const todos = validar(valores, definicion);
		setErrores(todos);

		const primero = Object.keys(definicion).find((nombre) => todos[nombre]);
		if (primero) {
			formulario.elements.namedItem(primero)?.focus();
			return;
		}

		const datos = Object.fromEntries(
			Object.entries(valores).map(([clave, valor]) => [clave, typeof valor === "string" ? valor.trim() : valor]),
		);
		alEnviar(datos);
	};

	/** Vuelve al estado inicial y limpia los estados de validacion. */
	const reiniciar = useCallback((nuevos = inicial) => {
		setValores(nuevos);
		setErrores({});
	}, [inicial]);

	return { valores, errores, registrar, estado, enviar, asignar, reiniciar };
}

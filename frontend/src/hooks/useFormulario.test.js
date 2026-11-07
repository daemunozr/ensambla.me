import { act, renderHook } from "@testing-library/react";
import { reglas } from "../utils/validaciones.js";
import { useFormulario } from "./useFormulario.js";

const INICIAL = { nombre: "", correo: "" };
const DEFINICION = {
	nombre: [reglas.requerido()],
	correo: [reglas.requerido(), reglas.correo()],
};

// Evento de cambio como lo emite un control: solo importa target.value.
const cambio = (valor) => ({ target: { value: valor } });

// Evento de envio con un formulario falso que sabe enfocar sus campos.
function envio() {
	const enfoques = {};
	const campo = (nombre) => ({ focus: () => (enfoques[nombre] = true) });
	return {
		evento: {
			preventDefault: vi.fn(),
			currentTarget: { elements: { namedItem: campo } },
		},
		enfoques,
	};
}

describe("useFormulario", () => {
	it("parte con los valores iniciales y sin errores", () => {
		const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

		expect(result.current.valores).toEqual(INICIAL);
		expect(result.current.errores).toEqual({});
		expect(result.current.estado("nombre")).toBe("");
	});

	describe("registrar", () => {
		it("entrega las props del control con su valor actual", () => {
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

			const props = result.current.registrar("nombre");

			expect(props.name).toBe("nombre");
			expect(props.value).toBe("");
		});

		it("onChange guarda el valor y valida el campo al escribir", () => {
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

			act(() => result.current.registrar("correo").onChange(cambio("ana@hotmail.com")));

			expect(result.current.valores.correo).toBe("ana@hotmail.com");
			expect(result.current.errores.correo).toMatch(/Solo se aceptan los dominios/);
			expect(result.current.estado("correo")).toBe("is-invalid");
		});

		it("un campo valido y con contenido queda is-valid", () => {
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

			act(() => result.current.registrar("correo").onChange(cambio("ana@duoc.cl")));

			expect(result.current.errores.correo).toBe("");
			expect(result.current.estado("correo")).toBe("is-valid");
		});

		it("onBlur valida el campo aunque no se haya escrito", () => {
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

			act(() => result.current.registrar("nombre").onBlur({ target: { value: "" } }));

			expect(result.current.errores.nombre).toBe("Este campo es obligatorio.");
		});

		it("un campo fuera de la definicion se guarda pero no se valida", () => {
			const { result } = renderHook(() => useFormulario({ ...INICIAL, nota: "" }, DEFINICION));

			act(() => result.current.registrar("nota").onChange(cambio("hola")));

			expect(result.current.valores.nota).toBe("hola");
			expect("nota" in result.current.errores).toBe(false);
		});
	});

	describe("enviar", () => {
		it("con errores no llama a alEnviar y enfoca el primer campo invalido", () => {
			const alEnviar = vi.fn();
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));
			const { evento, enfoques } = envio();

			act(() => result.current.enviar(alEnviar)(evento));

			expect(evento.preventDefault).toHaveBeenCalled();
			expect(alEnviar).not.toHaveBeenCalled();
			expect(result.current.errores.nombre).toBe("Este campo es obligatorio.");
			expect(result.current.errores.correo).toBe("Este campo es obligatorio.");
			expect(enfoques).toEqual({ nombre: true });
		});

		it("con todo valido llama a alEnviar con los valores recortados", () => {
			const alEnviar = vi.fn();
			const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

			act(() => {
				result.current.asignar({ nombre: "  Ana  ", correo: "ana@duoc.cl" });
			});
			act(() => result.current.enviar(alEnviar)(envio().evento));

			expect(alEnviar).toHaveBeenCalledTimes(1);
			expect(alEnviar).toHaveBeenCalledWith({ nombre: "Ana", correo: "ana@duoc.cl" });
		});
	});

	it("asignar cambia valores sin pasar por un evento", () => {
		const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

		act(() => result.current.asignar({ nombre: "Ana" }));

		expect(result.current.valores).toEqual({ nombre: "Ana", correo: "" });
	});

	it("reiniciar vuelve a los valores iniciales y limpia los errores", () => {
		const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));
		act(() => result.current.registrar("correo").onChange(cambio("malo")));

		act(() => result.current.reiniciar());

		expect(result.current.valores).toEqual(INICIAL);
		expect(result.current.errores).toEqual({});
	});

	it("reiniciar acepta valores nuevos", () => {
		const { result } = renderHook(() => useFormulario(INICIAL, DEFINICION));

		act(() => result.current.reiniciar({ nombre: "Ana", correo: "" }));

		expect(result.current.valores.nombre).toBe("Ana");
	});
});

import {
	DOMINIOS_PERMITIDOS,
	digitoVerificador,
	luhnValido,
	reglas,
	runValido,
	sugerenciasDeCorreo,
	validar,
	validarValor,
} from "./validaciones.js";

describe("digitoVerificador", () => {
	it("calcula el digito numerico por modulo 11", () => {
		expect(digitoVerificador("12345678")).toBe("5");
	});

	it("devuelve K cuando el resto es 10", () => {
		expect(digitoVerificador("1000005")).toBe("K");
	});

	it("devuelve 0 cuando el resto es 11", () => {
		expect(digitoVerificador("1000013")).toBe("0");
	});
});

describe("runValido", () => {
	it("acepta un RUN con el digito verificador correcto", () => {
		expect(runValido("123456785")).toBe(true);
		expect(runValido("10000130")).toBe(true);
	});

	it("acepta la K en minuscula", () => {
		expect(runValido("1000005k")).toBe(true);
	});

	it("rechaza un digito verificador incorrecto", () => {
		expect(runValido("123456784")).toBe(false);
	});

	it("rechaza puntos, guion, letras y largos fuera de rango", () => {
		expect(runValido("12.345.678-5")).toBe(false);
		expect(runValido("12345678-5")).toBe(false);
		expect(runValido("12AB45678")).toBe(false);
		expect(runValido("12345")).toBe(false);
		expect(runValido("")).toBe(false);
	});
});

describe("luhnValido", () => {
	it("acepta numeros de tarjeta con digito de control correcto", () => {
		expect(luhnValido("4242 4242 4242 4242")).toBe(true);
		expect(luhnValido("5555555555554444")).toBe(true);
	});

	it("rechaza numeros con el digito de control incorrecto", () => {
		expect(luhnValido("4242424242424241")).toBe(false);
	});

	it("rechaza un valor sin digitos", () => {
		expect(luhnValido("")).toBe(false);
		expect(luhnValido("abcd")).toBe(false);
	});
});

describe("reglas", () => {
	describe("requerido", () => {
		it("falla con un valor vacio o solo espacios", () => {
			expect(reglas.requerido()("")).toBe("Este campo es obligatorio.");
			expect(reglas.requerido()("   ")).toBe("Este campo es obligatorio.");
			expect(reglas.requerido()(undefined)).toBe("Este campo es obligatorio.");
		});

		it("pasa con contenido", () => {
			expect(reglas.requerido()("a")).toBe("");
		});

		it("usa el mensaje que se le indique", () => {
			expect(reglas.requerido("Falta el nombre.")("")).toBe("Falta el nombre.");
		});
	});

	describe("maximo y minimo", () => {
		it("maximo falla al superar el largo", () => {
			expect(reglas.maximo(3)("abcd")).toBe("No puede superar los 3 caracteres.");
			expect(reglas.maximo(3)("abc")).toBe("");
		});

		it("minimo falla con menos caracteres, pero no con un valor vacio", () => {
			expect(reglas.minimo(3)("ab")).toBe("Debe tener al menos 3 caracteres.");
			expect(reglas.minimo(3)("abc")).toBe("");
			expect(reglas.minimo(3)("")).toBe("");
		});
	});

	describe("run", () => {
		it("falla con un RUN invalido y pasa con uno valido o vacio", () => {
			expect(reglas.run()("123456784")).toMatch(/^RUN invalido/);
			expect(reglas.run()("123456785")).toBe("");
			expect(reglas.run()("")).toBe("");
		});
	});

	describe("correo", () => {
		it("pasa con un correo de un dominio permitido", () => {
			DOMINIOS_PERMITIDOS.forEach((dominio) => {
				expect(reglas.correo()(`ana${dominio}`)).toBe("");
			});
		});

		it("no distingue mayusculas", () => {
			expect(reglas.correo()("ANA@DUOC.CL")).toBe("");
		});

		it("falla con un formato invalido", () => {
			expect(reglas.correo()("ana")).toBe("Escribe un correo valido.");
			expect(reglas.correo()("ana@")).toBe("Escribe un correo valido.");
		});

		it("falla con un dominio no permitido", () => {
			expect(reglas.correo()("ana@hotmail.com")).toBe(
				"Solo se aceptan los dominios @duoc.cl, @profesor.duoc.cl, @gmail.com.",
			);
		});

		it("pasa si esta vacio", () => {
			expect(reglas.correo()("")).toBe("");
		});
	});

	describe("contrasena", () => {
		it("exige entre 4 y 10 caracteres", () => {
			const mensaje = "La contrasena debe tener entre 4 y 10 caracteres.";
			expect(reglas.contrasena()("abc")).toBe(mensaje);
			expect(reglas.contrasena()("abcdefghijk")).toBe(mensaje);
			expect(reglas.contrasena()("abcd")).toBe("");
			expect(reglas.contrasena()("abcdefghij")).toBe("");
		});

		it("pasa si esta vacia (lo exige requerido)", () => {
			expect(reglas.contrasena()("")).toBe("");
		});
	});

	describe("numeroMinimo, numeroMaximo y entero", () => {
		it("numeroMinimo falla por debajo del minimo y con texto", () => {
			expect(reglas.numeroMinimo(0)("-1")).toBe("No puede ser menor que 0.");
			expect(reglas.numeroMinimo(0)("0")).toBe("");
			expect(reglas.numeroMinimo(0)("abc")).toBe("Debe ser un numero.");
			expect(reglas.numeroMinimo(0)("")).toBe("");
		});

		it("numeroMaximo falla por encima del maximo y con texto", () => {
			expect(reglas.numeroMaximo(90)("91")).toBe("No puede ser mayor que 90.");
			expect(reglas.numeroMaximo(90)("90")).toBe("");
			expect(reglas.numeroMaximo(90)("abc")).toBe("Debe ser un numero.");
			expect(reglas.numeroMaximo(90)("")).toBe("");
		});

		it("entero rechaza los decimales y el texto", () => {
			expect(reglas.entero()("1.5")).toBe("Debe ser un numero entero, sin decimales.");
			expect(reglas.entero()("2")).toBe("");
			expect(reglas.entero()("abc")).toBe("Debe ser un numero.");
			expect(reglas.entero()("")).toBe("");
		});
	});

	describe("seleccion y patron", () => {
		it("seleccion falla sin opcion elegida", () => {
			expect(reglas.seleccion()("")).toBe("Selecciona una opcion.");
			expect(reglas.seleccion("Elige una region.")("")).toBe("Elige una region.");
			expect(reglas.seleccion()("RM")).toBe("");
		});

		it("patron exige que el valor calce con la expresion", () => {
			const soloLetras = reglas.patron(/^[a-z]+$/i, "Solo letras.");
			expect(soloLetras("abc")).toBe("");
			expect(soloLetras("ab1")).toBe("Solo letras.");
			expect(soloLetras("")).toBe("");
		});
	});

	describe("tarjeta", () => {
		it("pasa con un numero valido, con o sin espacios", () => {
			expect(reglas.tarjeta()("4242 4242 4242 4242")).toBe("");
			expect(reglas.tarjeta()("4242424242424242")).toBe("");
		});

		it("falla con caracteres que no son numeros", () => {
			expect(reglas.tarjeta()("4242-4242-4242-4242")).toBe("Escribe solo numeros, sin guiones ni letras.");
		});

		it("falla fuera de 13 a 19 digitos", () => {
			expect(reglas.tarjeta()("4242 4242")).toBe("El numero debe tener entre 13 y 19 digitos.");
		});

		it("falla con un digito de control invalido", () => {
			expect(reglas.tarjeta()("4242 4242 4242 4241")).toBe("El numero de la tarjeta no es valido: revisa los digitos.");
		});

		it("pasa si esta vacio", () => {
			expect(reglas.tarjeta()("")).toBe("");
		});
	});

	describe("vencimiento", () => {
		const octubre2026 = new Date(2026, 9, 15);
		const regla = reglas.vencimiento(octubre2026);

		it("acepta el mes actual y los futuros", () => {
			expect(regla("10/26")).toBe("");
			expect(regla("01/30")).toBe("");
		});

		it("rechaza una tarjeta vencida", () => {
			expect(regla("09/26")).toBe("La tarjeta esta vencida.");
			expect(regla("12/25")).toBe("La tarjeta esta vencida.");
		});

		it("exige el formato MM/AA", () => {
			expect(regla("1026")).toBe("Usa el formato MM/AA. Ejemplo: 08/29.");
			expect(regla("ab/cd")).toBe("Usa el formato MM/AA. Ejemplo: 08/29.");
		});

		it("exige un mes entre 01 y 12", () => {
			expect(regla("13/30")).toBe("El mes debe estar entre 01 y 12.");
			expect(regla("00/30")).toBe("El mes debe estar entre 01 y 12.");
		});

		it("pasa si esta vacio", () => {
			expect(regla("")).toBe("");
		});

		it("sin fecha de referencia usa la de hoy", () => {
			expect(reglas.vencimiento()("01/00")).toBe("La tarjeta esta vencida.");
		});
	});

	describe("cvv", () => {
		it("acepta 3 o 4 digitos", () => {
			expect(reglas.cvv()("123")).toBe("");
			expect(reglas.cvv()("1234")).toBe("");
		});

		it("rechaza otros largos y letras", () => {
			expect(reglas.cvv()("12")).toBe("El codigo de seguridad tiene 3 o 4 digitos.");
			expect(reglas.cvv()("12345")).toBe("El codigo de seguridad tiene 3 o 4 digitos.");
			expect(reglas.cvv()("12a")).toBe("El codigo de seguridad tiene 3 o 4 digitos.");
		});

		it("pasa si esta vacio", () => {
			expect(reglas.cvv()("")).toBe("");
		});
	});
});

describe("validarValor", () => {
	it("devuelve el primer error de la lista de reglas", () => {
		const lista = [reglas.requerido(), reglas.minimo(5)];
		expect(validarValor("", lista)).toBe("Este campo es obligatorio.");
		expect(validarValor("abc", lista)).toBe("Debe tener al menos 5 caracteres.");
	});

	it("devuelve cadena vacia si pasa todas o no hay reglas", () => {
		expect(validarValor("abcde", [reglas.requerido(), reglas.minimo(5)])).toBe("");
		expect(validarValor("x")).toBe("");
	});
});

describe("validar", () => {
	const definicion = {
		nombre: [reglas.requerido()],
		correo: [reglas.requerido(), reglas.correo()],
	};

	it("devuelve el error de cada campo definido", () => {
		expect(validar({ nombre: "", correo: "ana@duoc.cl" }, definicion)).toEqual({
			nombre: "Este campo es obligatorio.",
			correo: "",
		});
	});

	it("un campo que falta en los valores se valida como vacio", () => {
		expect(validar({}, definicion).correo).toBe("Este campo es obligatorio.");
	});
});

describe("sugerenciasDeCorreo", () => {
	it("completa lo escrito antes de la arroba con cada dominio permitido", () => {
		expect(sugerenciasDeCorreo("Ana@")).toEqual(["ana@duoc.cl", "ana@profesor.duoc.cl", "ana@gmail.com"]);
	});

	it("sin texto usa un ejemplo", () => {
		expect(sugerenciasDeCorreo("")[0]).toBe("tucorreo@duoc.cl");
		expect(sugerenciasDeCorreo(undefined)[0]).toBe("tucorreo@duoc.cl");
	});
});

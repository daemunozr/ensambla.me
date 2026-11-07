package cl.duoc.ensamblame.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Credenciales para iniciar sesion. */
public record LoginRequest(

        @NotBlank(message = "El correo es obligatorio.")
        String correo,

        @NotBlank(message = "La contrasena es obligatoria.")
        String contrasena) {
}

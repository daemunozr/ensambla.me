package cl.duoc.ensamblame.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Credenciales para iniciar sesion. */
public record LoginRequest(

        @NotBlank(message = "El correo es obligatorio.")
        @Schema(description = "Correo de la cuenta", example = "camila@gmail.com")
        String correo,

        @NotBlank(message = "La contrasena es obligatoria.")
        @Schema(description = "Contrasena de la cuenta", example = "cliente123")
        String contrasena) {
}

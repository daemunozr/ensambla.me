package cl.duoc.ensamblame.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Token de renovacion que se canjea por un token de acceso nuevo. */
public record RefreshRequest(

        @NotBlank(message = "El token de renovacion es obligatorio.")
        @Schema(description = "Token de renovacion entregado por el login o por una renovacion anterior", example = "eyJhbGciOiJIUzI1NiJ9...")
        String refreshToken) {
}

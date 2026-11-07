package cl.duoc.ensamblame.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Token de renovacion que se canjea por un token de acceso nuevo. */
public record RefreshRequest(

        @NotBlank(message = "El token de renovacion es obligatorio.")
        String refreshToken) {
}

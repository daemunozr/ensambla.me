package cl.duoc.ensamblame.dto.response;

import cl.duoc.ensamblame.model.TipoUsuario;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Respuesta del login y de la renovacion. "expiraEn" son los segundos de vida del token de acceso.
 * Trae tambien los datos que el frontend necesita para armar la sesion (quien es y que rol tiene).
 */
public record TokenResponse(
        @Schema(description = "Token para el encabezado Authorization: Bearer (dura 15 minutos)")
        String accessToken,
        @Schema(description = "Token para renovar la sesion (dura 7 dias)")
        String refreshToken,
        @Schema(description = "Tipo de token", example = "Bearer")
        String tipo,
        @Schema(description = "Segundos de vida del token de acceso", example = "900")
        long expiraEn,
        @Schema(description = "RUN de la cuenta", example = "123456785")
        String run,
        @Schema(description = "Nombre de la cuenta", example = "Camila")
        String nombre,
        @Schema(description = "Rol de la cuenta", example = "CLIENTE")
        TipoUsuario rol) {
}

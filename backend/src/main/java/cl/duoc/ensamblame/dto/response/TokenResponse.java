package cl.duoc.ensamblame.dto.response;

import cl.duoc.ensamblame.model.TipoUsuario;

/**
 * Respuesta del login y de la renovacion. "expiraEn" son los segundos de vida del token de acceso.
 * Trae tambien los datos que el frontend necesita para armar la sesion (quien es y que rol tiene).
 */
public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tipo,
        long expiraEn,
        String run,
        String nombre,
        TipoUsuario rol) {
}

package cl.duoc.ensamblame.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

/** Cuerpo de todas las respuestas de error. "errores" lleva el mensaje de cada campo invalido (puede ser null). */
public record ErrorResponse(
        @Schema(description = "Codigo HTTP", example = "404")
        int estado,
        @Schema(description = "Que fallo, en palabras", example = "No existe el producto XYZ.")
        String mensaje,
        @Schema(description = "Mensaje de cada campo invalido (null si el error no es de validacion)",
                example = "{\"precio\": \"El precio no puede ser negativo.\"}")
        Map<String, String> errores,
        @Schema(description = "Momento del error")
        LocalDateTime fecha) {
}

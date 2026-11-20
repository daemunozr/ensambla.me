package cl.duoc.ensamblame.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear o editar una categoria. No incluye el paso del asistente de armado ("orden"): lo
 * fija la carga inicial, porque el recorrido depende de una tabla de compatibilidad que no se
 * mantiene desde el panel.
 */
public record CategoriaRequest(

        @NotBlank(message = "El codigo es obligatorio.")
        @Size(min = 3, max = 30, message = "El codigo debe tener entre 3 y 30 caracteres.")
        @Pattern(regexp = "[a-z0-9-]*", message = "El codigo solo admite minusculas, numeros y guiones.")
        @Schema(description = "Codigo unico: minusculas, numeros y guiones", example = "gpu")
        String codigo,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre admite hasta 50 caracteres.")
        @Schema(description = "Nombre visible", example = "Tarjetas de video")
        String nombre) {
}

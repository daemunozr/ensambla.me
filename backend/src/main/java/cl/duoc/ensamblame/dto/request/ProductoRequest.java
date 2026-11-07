package cl.duoc.ensamblame.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Datos para crear o editar un producto. "categoria" es el codigo de una categoria existente. */
public record ProductoRequest(

        @NotBlank(message = "El codigo (SKU) es obligatorio.")
        @Size(min = 3, max = 50, message = "El SKU debe tener entre 3 y 50 caracteres.")
        @Schema(description = "Codigo unico del producto", example = "CPU-R5-7600")
        String sku,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 100, message = "El nombre admite hasta 100 caracteres.")
        @Schema(description = "Nombre", example = "AMD Ryzen 5 7600")
        String nombre,

        @Size(max = 500, message = "La descripcion admite hasta 500 caracteres.")
        @Schema(description = "Descripcion (opcional)", example = "Procesador de 6 nucleos, socket AM5")
        String descripcion,

        @NotNull(message = "El precio es obligatorio.")
        @DecimalMin(value = "0", message = "El precio no puede ser negativo.")
        @Schema(description = "Precio de lista en pesos, con IVA incluido", example = "249990")
        BigDecimal precio,

        @Min(value = 0, message = "El descuento va de 0 a 90.")
        @Max(value = 90, message = "El descuento va de 0 a 90.")
        @Schema(description = "Porcentaje de descuento, de 0 a 90 (opcional)", example = "15")
        Integer descuento,

        @NotNull(message = "El stock es obligatorio.")
        @Min(value = 0, message = "El stock no puede ser negativo.")
        @Schema(description = "Unidades disponibles", example = "18")
        Integer stock,

        @Min(value = 0, message = "El stock critico no puede ser negativo.")
        @Schema(description = "Stock bajo el cual se considera critico (opcional)", example = "5")
        Integer stockCritico,

        @Size(max = 255, message = "La imagen admite hasta 255 caracteres.")
        @Schema(description = "Ruta de la imagen (opcional)", example = "resources/img/productos/CPU-R5-7600.webp")

        String imagen,

        @Size(max = 255, message = "El video admite hasta 255 caracteres.")
        @Schema(description = "Enlace de un video (opcional)", example = "")

        String video,

        @NotBlank(message = "La categoria es obligatoria.")
        @Schema(description = "Codigo de una categoria existente", example = "cpu")
        String categoria) {
}

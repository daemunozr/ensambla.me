package cl.duoc.ensamblame.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Una linea de la compra: el SKU de un producto existente y cuantas unidades se llevan. */
public record LineaBoletaRequest(

        @NotBlank(message = "El SKU de cada linea es obligatorio.")
        String sku,

        @NotNull(message = "La cantidad de cada linea es obligatoria.")
        @Min(value = 1, message = "La cantidad de cada linea debe ser al menos 1.")
        Integer cantidad) {
}

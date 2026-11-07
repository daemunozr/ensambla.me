package cl.duoc.ensamblame.dto.request;

import cl.duoc.ensamblame.model.TipoEntrega;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Datos de una compra. La cuenta compradora no viene en el cuerpo sino en el token (sin token, la
 * compra es de invitado). Los precios y el costo de envio los calcula el servidor.
 */
public record BoletaRequest(

        @NotBlank(message = "El nombre del comprador es obligatorio.")
        @Size(max = 150, message = "El nombre admite hasta 150 caracteres.")
        @Schema(description = "Nombre de quien compra", example = "Camila Soto")
        String nombre,

        @NotBlank(message = "El correo es obligatorio.")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres.")
        @Pattern(regexp = "[^@\\s]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)",
                message = "Solo se aceptan los dominios duoc.cl, profesor.duoc.cl y gmail.com.")
        @Schema(description = "Correo de contacto", example = "camila@gmail.com")
        String correo,

        @NotBlank(message = "La direccion es obligatoria.")
        @Size(max = 300, message = "La direccion admite hasta 300 caracteres.")
        @Schema(description = "Direccion de despacho", example = "Irarrazaval 2550, Nunoa")
        String direccion,

        @NotBlank(message = "La comuna es obligatoria.")
        @Size(max = 10, message = "La comuna es un codigo de hasta 10 caracteres, como RM-02.")
        @Schema(description = "Codigo de la comuna", example = "RM-04")
        String comuna,

        @NotNull(message = "La entrega es obligatoria (DOMICILIO o RETIRO).")
        @Schema(description = "DOMICILIO (4990, gratis desde 200000) o RETIRO (0)", example = "DOMICILIO")
        TipoEntrega entrega,

        @NotBlank(message = "El medio de pago es obligatorio.")
        @Size(max = 50, message = "El medio de pago admite hasta 50 caracteres.")
        @Schema(description = "Medio de pago", example = "Tarjeta de credito")
        String medioPago,

        @NotEmpty(message = "La compra debe tener al menos un producto.")
        @Schema(description = "Productos que se compran; no puede ir vacia")
        List<@Valid LineaBoletaRequest> lineas) {
}

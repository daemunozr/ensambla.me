package cl.duoc.ensamblame.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Datos que una cuenta puede cambiar de si misma. No incluye el RUN ni el tipo de usuario. La
 * contrasena solo se cambia si vienen las dos: la actual (se comprueba) y la nueva.
 */
public record PerfilRequest(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre admite hasta 50 caracteres.")
        @Schema(description = "Nombre", example = "Camila")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios.")
        @Size(max = 100, message = "Los apellidos admiten hasta 100 caracteres.")
        @Schema(description = "Apellidos", example = "Soto Rojas")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio.")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres.")
        @Pattern(regexp = "[^@\\s]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Solo se aceptan los dominios duoc.cl, profesor.duoc.cl y gmail.com.")
        @Schema(description = "Correo (dominios duoc.cl, profesor.duoc.cl o gmail.com)", example = "camila@gmail.com")
        String correo,

        @Past(message = "La fecha de nacimiento debe ser pasada.")
        @Schema(description = "Fecha de nacimiento (AAAA-MM-DD, opcional)", example = "2000-05-14")
        LocalDate fechaNacimiento,

        @NotBlank(message = "La region es obligatoria.")
        @Size(max = 10, message = "La region es un codigo de hasta 10 caracteres, como RM.")
        @Schema(description = "Codigo de la region", example = "RM")
        String region,

        @NotBlank(message = "La comuna es obligatoria.")
        @Size(max = 10, message = "La comuna es un codigo de hasta 10 caracteres, como RM-02.")
        @Schema(description = "Codigo de la comuna", example = "RM-04")
        String comuna,

        @NotBlank(message = "La direccion es obligatoria.")
        @Size(max = 300, message = "La direccion admite hasta 300 caracteres.")
        @Schema(description = "Direccion de despacho", example = "Irarrazaval 2550, Nunoa")
        String direccion,

        @Schema(description = "Contrasena actual; obligatoria solo si se envia una nueva", example = "cliente123")
        String contrasenaActual,

        @Size(min = 4, max = 10, message = "La contrasena debe tener entre 4 y 10 caracteres.")
        @Schema(description = "Contrasena nueva de 4 a 10 caracteres (opcional)", example = "nueva1234")
        String contrasenaNueva) {
}

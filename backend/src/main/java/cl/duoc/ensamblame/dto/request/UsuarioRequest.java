package cl.duoc.ensamblame.dto.request;

import cl.duoc.ensamblame.model.TipoUsuario;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Datos para crear o editar un usuario. */
public record UsuarioRequest(

        @NotBlank(message = "El RUN es obligatorio.")
        @Pattern(regexp = "[0-9]{6,8}[0-9kK]", message = "El RUN va sin puntos ni guion, de 7 a 9 caracteres.")
        @Schema(description = "RUN sin puntos ni guion", example = "187654321")
        String run,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre admite hasta 50 caracteres.")
        @Schema(description = "Nombre", example = "Valentina")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios.")
        @Size(max = 100, message = "Los apellidos admiten hasta 100 caracteres.")
        @Schema(description = "Apellidos", example = "Rojas Soto")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio.")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres.")
        @Pattern(regexp = "[^@\\s]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Solo se aceptan los dominios duoc.cl, profesor.duoc.cl y gmail.com.")
        @Schema(description = "Correo (dominios duoc.cl, profesor.duoc.cl o gmail.com)", example = "valentina@gmail.com")
        String correo,

        @NotBlank(message = "La contrasena es obligatoria.")
        @Size(min = 4, max = 10, message = "La contrasena debe tener entre 4 y 10 caracteres.")
        @Schema(description = "Contrasena de 4 a 10 caracteres", example = "clave1234")
        String contrasena,

        @Past(message = "La fecha de nacimiento debe ser pasada.")
        @Schema(description = "Fecha de nacimiento (AAAA-MM-DD)", example = "2000-05-14")
        LocalDate fechaNacimiento,

        @NotBlank(message = "La region es obligatoria.")
        @Size(max = 10, message = "La region es un codigo de hasta 10 caracteres, como RM.")
        @Schema(description = "Codigo de la region", example = "RM")
        String region,

        @NotBlank(message = "La comuna es obligatoria.")
        @Size(max = 10, message = "La comuna es un codigo de hasta 10 caracteres, como RM-02.")
        @Schema(description = "Codigo de la comuna", example = "RM-02")
        String comuna,

        @NotBlank(message = "La direccion es obligatoria.")
        @Size(max = 300, message = "La direccion admite hasta 300 caracteres.")
        @Schema(description = "Direccion de despacho", example = "Av. Providencia 1234, depto 5")
        String direccion,

        @NotNull(message = "El tipo de usuario es obligatorio.")
        @Schema(description = "Rol de la cuenta: ADMIN, LOGISTICA o CLIENTE", example = "LOGISTICA")
        TipoUsuario tipoUsuario) {
}

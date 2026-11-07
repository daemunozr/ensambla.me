package cl.duoc.ensamblame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Datos del registro publico. No incluye el tipo de usuario: quien se registra siempre es Cliente,
 * y los demas roles solo los crea un administrador.
 */
public record RegistroRequest(

        @NotBlank(message = "El RUN es obligatorio.")
        @Pattern(regexp = "[0-9]{6,8}[0-9kK]", message = "El RUN va sin puntos ni guion, de 7 a 9 caracteres.")
        String run,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre admite hasta 50 caracteres.")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios.")
        @Size(max = 100, message = "Los apellidos admiten hasta 100 caracteres.")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio.")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres.")
        @Pattern(regexp = "[^@\\s]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)",
                message = "Solo se aceptan los dominios duoc.cl, profesor.duoc.cl y gmail.com.")
        String correo,

        @NotBlank(message = "La contrasena es obligatoria.")
        @Size(min = 4, max = 10, message = "La contrasena debe tener entre 4 y 10 caracteres.")
        String contrasena,

        @Past(message = "La fecha de nacimiento debe ser pasada.")
        LocalDate fechaNacimiento,

        @NotBlank(message = "La region es obligatoria.")
        String region,

        @NotBlank(message = "La comuna es obligatoria.")
        String comuna,

        @NotBlank(message = "La direccion es obligatoria.")
        @Size(max = 300, message = "La direccion admite hasta 300 caracteres.")
        String direccion) {
}

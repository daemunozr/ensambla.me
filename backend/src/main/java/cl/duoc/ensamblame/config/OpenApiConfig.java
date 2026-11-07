package cl.duoc.ensamblame.config;

import cl.duoc.ensamblame.dto.response.ErrorResponse;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import java.util.List;
import java.util.Map;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentacion de la API (Swagger UI en /swagger-ui.html y especificacion en /v3/api-docs).
 * Las rutas privadas se prueban con el boton "Authorize": primero se inicia sesion en
 * POST /api/v1/auth/login y se pega el accessToken.
 */
@Configuration
@OpenAPIDefinition(info = @Info(
        title = "Ensambla.me API",
        version = "v1",
        description = """
                API REST de la tienda de componentes de PC Ensambla.me: catalogo, usuarios y boletas.

                **Como probar las rutas privadas:** (1) ejecuta `POST /api/v1/auth/login` con una cuenta de \
                ejemplo (`admin@duoc.cl` / `admin1234`, `bodega@duoc.cl` / `bodega123` o \
                `camila@gmail.com` / `cliente123`); (2) copia el `accessToken` de la respuesta; (3) pulsa \
                **Authorize** y pegalo. El token dura 15 minutos; se renueva con `POST /api/v1/auth/refresh`.

                **Roles:** `ADMIN` (todo), `LOGISTICA` (lee productos y boletas) y `CLIENTE` (compra y ve sus boletas). \
                Sin sesion responde 401; con un rol sin permiso, 403."""))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Token de acceso entregado por /api/v1/auth/login.")
public class OpenApiConfig {

    /** Extension que marca una operacion cuyo token es opcional; ver el controlador de boletas. */
    public static final String TOKEN_OPCIONAL = "x-token-opcional";

    /** Documenta 401 y 403 en toda operacion que exige sesion, sin repetirlo en cada metodo. */
    @Bean
    public OpenApiCustomizer erroresDeSeguridad() {
        return openApi -> {
            // Registra el esquema del cuerpo de error, por si ninguna operacion lo referencia.
            Map<String, Schema> esquemas = ModelConverters.getInstance().read(ErrorResponse.class);
            if (openApi.getComponents() == null) {
                openApi.setComponents(new Components());
            }
            esquemas.forEach(openApi.getComponents()::addSchemas);

            openApi.getPaths().values().forEach(ruta -> ruta.readOperations().forEach(operacion -> {
                // springdoc descarta el requisito vacio ({}), asi que el token opcional (POST /boletas) se marca con
                // la extension x-token-opcional y aqui se convierte en "bearerAuth o sin token".
                boolean tokenOpcional = operacion.getExtensions() != null
                        && operacion.getExtensions().remove(TOKEN_OPCIONAL) != null;
                if (tokenOpcional) {
                    operacion.setSecurity(List.of(new SecurityRequirement().addList("bearerAuth"), new SecurityRequirement()));
                }
                boolean exigeSesion = operacion.getSecurity() != null && !operacion.getSecurity().isEmpty() && !tokenOpcional;
                if (exigeSesion) {
                    agregarSiFalta(operacion, "401", "Falta la sesion o el token es invalido o esta vencido.");
                    agregarSiFalta(operacion, "403", "La sesion es valida pero el rol no tiene permiso.");
                }
                // Todo error comparte el mismo cuerpo (ErrorResponse). springdoc pone ahi el tipo que devuelve
                // el metodo, que no es el del error, asi que se reemplaza.
                operacion.getResponses().forEach((codigo, respuesta) -> {
                    if (codigo.startsWith("4") || codigo.startsWith("5")) {
                        respuesta.setContent(contenidoError());
                    }
                });
            }));
        };
    }

    private void agregarSiFalta(Operation operacion, String codigo, String descripcion) {
        if (operacion.getResponses().get(codigo) == null) {
            operacion.getResponses().addApiResponse(codigo, new ApiResponse().description(descripcion));
        }
    }

    private Content contenidoError() {
        Schema<?> esquema = new Schema<>().$ref("#/components/schemas/ErrorResponse");
        return new Content().addMediaType("application/json", new MediaType().schema(esquema));
    }
}

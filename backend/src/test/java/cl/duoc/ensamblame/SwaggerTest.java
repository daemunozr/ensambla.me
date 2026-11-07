package cl.duoc.ensamblame;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Arranca la aplicacion completa (JPA, CargaInicial, seguridad y springdoc) con H2 en memoria y
 * revisa la especificacion OpenAPI que publica. Tambien recorre login -> token -> consulta real.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:swagger;MODE=MariaDB;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secreto=secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres"})
class SwaggerTest {

    private static final List<String> RUTAS = List.of(
            "/api/v1/auth/login", "/api/v1/auth/registro", "/api/v1/auth/refresh",
            "/api/v1/categorias", "/api/v1/categorias/{codigo}",
            "/api/v1/productos", "/api/v1/productos/{sku}",
            "/api/v1/usuarios", "/api/v1/usuarios/me", "/api/v1/usuarios/{run}",
            "/api/v1/boletas", "/api/v1/boletas/{numero}");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper mapper;

    private JsonNode especificacion() throws Exception {
        String cuerpo = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(cuerpo);
    }

    @Test
    void laEspecificacionYLaInterfazSePublicanSinToken() throws Exception {
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    @Test
    void laEspecificacionDocumentaTodasLasRutasDeLaApi() throws Exception {
        JsonNode paths = especificacion().get("paths");
        List<String> publicadas = new ArrayList<>();
        publicadas.addAll(paths.propertyNames());
        assertThat(publicadas).containsExactlyInAnyOrderElementsOf(RUTAS);
    }

    @Test
    void laEspecificacionDeclaraElEsquemaBearerYElCuerpoDeError() throws Exception {
        JsonNode raiz = especificacion();
        assertThat(raiz.at("/info/title").asText()).isEqualTo("Ensambla.me API");
        assertThat(raiz.at("/components/securitySchemes/bearerAuth/scheme").asText()).isEqualTo("bearer");
        assertThat(raiz.at("/components/schemas/ErrorResponse").isMissingNode()).isFalse();
    }

    @Test
    void todaOperacionTieneResumenYSusErroresUsanErrorResponse() throws Exception {
        JsonNode paths = especificacion().get("paths");
        paths.forEach(ruta -> ruta.forEach(operacion -> {
            assertThat(operacion.path("summary").asText()).as("summary de %s", operacion).isNotBlank();
            operacion.get("responses").properties().forEach(entrada -> {
                if (entrada.getKey().startsWith("4") || entrada.getKey().startsWith("5")) {
                    assertThat(entrada.getValue().at("/content/application~1json/schema/$ref").asText())
                            .as("cuerpo del %s en %s", entrada.getKey(), operacion.path("summary").asText())
                            .endsWith("/ErrorResponse");
                }
            });
        }));
    }

    @Test
    void lasRutasPrivadasDeclaranSeguridadYDocumentan401y403() throws Exception {
        JsonNode paths = especificacion().get("paths");
        for (String[] privada : new String[][] {
                {"/api/v1/usuarios", "get"}, {"/api/v1/usuarios/me", "get"}, {"/api/v1/usuarios/{run}", "delete"},
                {"/api/v1/categorias", "post"}, {"/api/v1/categorias/{codigo}", "delete"},
                {"/api/v1/productos", "post"}, {"/api/v1/productos/{sku}", "put"},
                {"/api/v1/boletas", "get"}, {"/api/v1/boletas/{numero}", "get"}}) {
            JsonNode operacion = paths.get(privada[0]).get(privada[1]);
            assertThat(operacion.path("security").isEmpty()).as("security de %s %s", privada[1], privada[0]).isFalse();
            assertThat(operacion.at("/responses/401").isMissingNode()).as("401 de %s %s", privada[1], privada[0]).isFalse();
            assertThat(operacion.at("/responses/403").isMissingNode()).as("403 de %s %s", privada[1], privada[0]).isFalse();
        }
    }

    @Test
    void lasRutasPublicasNoDeclaranSeguridad() throws Exception {
        JsonNode paths = especificacion().get("paths");
        for (String[] publica : new String[][] {
                {"/api/v1/auth/login", "post"}, {"/api/v1/auth/registro", "post"}, {"/api/v1/auth/refresh", "post"},
                {"/api/v1/categorias", "get"}, {"/api/v1/productos", "get"}, {"/api/v1/productos/{sku}", "get"}}) {
            JsonNode operacion = paths.get(publica[0]).get(publica[1]);
            assertThat(operacion.path("security").isEmpty()).as("security de %s %s", publica[1], publica[0]).isTrue();
            assertThat(operacion.at("/responses/403").isMissingNode()).as("403 de %s %s", publica[1], publica[0]).isTrue();
        }
    }

    @Test
    void comprarAceptaTokenOpcionalYNoDocumentaUn403() throws Exception {
        JsonNode comprar = especificacion().at("/paths/~1api~1v1~1boletas/post");
        assertThat(comprar.at("/responses/403").isMissingNode()).isTrue();
        assertThat(comprar.at("/responses/401").isMissingNode()).isFalse();
        assertThat(comprar.get("security").toString()).contains("bearerAuth").contains("{}");
    }

    @Test
    void conUnLoginRealUnAdminVeLasTresBoletasDeLaCargaInicial() throws Exception {
        String login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"admin@duoc.cl\",\"contrasena\":\"admin1234\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = mapper.readTree(login).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/boletas").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }
}

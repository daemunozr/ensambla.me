package cl.duoc.ensamblame.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cl.duoc.ensamblame.config.CorsConfig;
import cl.duoc.ensamblame.config.SeguridadConfig;
import cl.duoc.ensamblame.controller.AuthController;
import cl.duoc.ensamblame.controller.BoletaController;
import cl.duoc.ensamblame.controller.CategoriaController;
import cl.duoc.ensamblame.controller.ProductoController;
import cl.duoc.ensamblame.controller.UsuarioController;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import cl.duoc.ensamblame.service.AuthService;
import cl.duoc.ensamblame.service.BoletaService;
import cl.duoc.ensamblame.service.CategoriaService;
import cl.duoc.ensamblame.service.ProductoService;
import cl.duoc.ensamblame.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Prueba las reglas de acceso de SeguridadConfig con el filtro de seguridad real y tokens reales
 * (JwtService), pero sin base de datos: los servicios son mocks. Comprueba quien puede entrar a
 * cada ruta, no lo que hacen los controladores.
 */
@WebMvcTest(controllers = {AuthController.class, CategoriaController.class, ProductoController.class,
        UsuarioController.class, BoletaController.class})
@Import({SeguridadConfig.class, CorsConfig.class, JwtService.class, UsuarioDetailsService.class,
        AuthEntryPoint.class, AccesoDenegadoHandler.class})
@TestPropertySource(properties = {
        "jwt.secreto=secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres",
        "jwt.acceso-minutos=15",
        "jwt.renovacion-dias=7",
        "app.cors.origen=http://localhost:8081,http://localhost:5173"})
class SeguridadWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CategoriaService categoriaService;

    @MockitoBean
    private ProductoService productoService;

    @MockitoBean
    private UsuarioService usuarioService;

    @MockitoBean
    private BoletaService boletaService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private static final String PRODUCTO_JSON = """
            {"sku": "CPU-R5-7600", "nombre": "AMD Ryzen 5 7600", "precio": 249990, "stock": 18, "categoria": "cpu"}
            """;

    private static final String BOLETA_JSON = """
            {"nombre": "Camila", "correo": "camila@gmail.com", "direccion": "Irarrazaval 2550",
             "comuna": "RM-04", "entrega": "RETIRO", "medioPago": "Tarjeta",
             "lineas": [{"sku": "PER-KB-MECH", "cantidad": 1}]}
            """;

    // Cabecera "Authorization" con un token de acceso real para ese rol.
    private String como(TipoUsuario rol) {
        Usuario usuario = new Usuario();
        usuario.setRun("123456785");
        usuario.setCorreo("usuario@duoc.cl");
        usuario.setTipoUsuario(rol);
        return "Bearer " + jwtService.generarAcceso(usuario);
    }

    // --- Rutas publicas ---

    @Test
    void elCatalogoSeVeSinSesion() throws Exception {
        mockMvc.perform(get("/api/v1/productos")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/productos/CPU-R5-7600")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/categorias")).andExpect(status().isOk());
    }

    @Test
    void lasRutasDeAuthSonPublicas() throws Exception {
        // Llegan al controlador (el cuerpo vacio da 400); no las corta la seguridad con 401.
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sePuedeComprarSinSesion() throws Exception {
        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(BOLETA_JSON))
                .andExpect(status().isCreated());
    }

    // --- Sin sesion (401) ---

    @Test
    void sinSesionNoSePuedeModificarElCatalogoNiVerUsuariosNiBoletas() throws Exception {
        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.estado").value(401));
        mockMvc.perform(delete("/api/v1/categorias/cpu")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/usuarios")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/usuarios/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/boletas")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/boletas/ORD-2026-0001")).andExpect(status().isUnauthorized());
    }

    // --- Rol sin permiso (403) ---

    @Test
    void unClienteNoPuedeModificarElCatalogoNiVerUsuarios() throws Exception {
        mockMvc.perform(post("/api/v1/productos").header("Authorization", como(TipoUsuario.CLIENTE))
                .contentType(MediaType.APPLICATION_JSON).content(PRODUCTO_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.estado").value(403));
        mockMvc.perform(delete("/api/v1/productos/CPU-R5-7600").header("Authorization", como(TipoUsuario.CLIENTE)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/usuarios").header("Authorization", como(TipoUsuario.CLIENTE)))
                .andExpect(status().isForbidden());
    }

    @Test
    void elPersonalLogisticoSoloLeeProductosYBoletas() throws Exception {
        String logistica = como(TipoUsuario.LOGISTICA);

        mockMvc.perform(post("/api/v1/productos").header("Authorization", logistica)
                .contentType(MediaType.APPLICATION_JSON).content(PRODUCTO_JSON))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/v1/categorias/cpu").header("Authorization", logistica))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/usuarios").header("Authorization", logistica))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/boletas").header("Authorization", logistica)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/productos").header("Authorization", logistica)).andExpect(status().isOk());
    }

    // --- Rol con permiso ---

    @Test
    void elAdministradorPuedeModificarElCatalogoYAdministrarUsuarios() throws Exception {
        String admin = como(TipoUsuario.ADMIN);

        mockMvc.perform(post("/api/v1/productos").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON).content(PRODUCTO_JSON))
                .andExpect(status().isCreated());
        mockMvc.perform(delete("/api/v1/productos/CPU-R5-7600").header("Authorization", admin))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/usuarios").header("Authorization", admin)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/boletas").header("Authorization", admin)).andExpect(status().isOk());
    }

    @Test
    void cualquierRolConSesionVeSuPerfilYUnClienteVeSusBoletas() throws Exception {
        for (TipoUsuario rol : TipoUsuario.values()) {
            mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", como(rol)))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/v1/boletas").header("Authorization", como(TipoUsuario.CLIENTE)))
                .andExpect(status().isOk());
    }

    // --- Tokens que no sirven (401, incluso en rutas publicas) ---

    @Test
    void unTokenInvalidoDa401AunqueLaRutaSeaPublica() throws Exception {
        mockMvc.perform(get("/api/v1/productos").header("Authorization", "Bearer esto-no-es-un-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void unTokenVencidoDa401() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setRun("123456785");
        usuario.setCorreo("usuario@duoc.cl");
        usuario.setTipoUsuario(TipoUsuario.ADMIN);
        JwtService vencido = new JwtService("secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres", -1, 7);

        mockMvc.perform(get("/api/v1/usuarios").header("Authorization", "Bearer " + vencido.generarAcceso(usuario)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unTokenDeRenovacionNoSirveParaAccederARecursos() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setRun("123456785");
        usuario.setCorreo("usuario@duoc.cl");
        usuario.setTipoUsuario(TipoUsuario.ADMIN);

        mockMvc.perform(get("/api/v1/usuarios")
                .header("Authorization", "Bearer " + jwtService.generarRenovacion(usuario)))
                .andExpect(status().isUnauthorized());
    }

    // --- CORS ---

    @Test
    void elPreflightDelFrontendConAuthorizationEsAceptado() throws Exception {
        mockMvc.perform(options("/api/v1/productos")
                .header("Origin", "http://localhost:8081")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"));
    }

    @Test
    void unOrigenNoAutorizadoNoPasaElPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/productos")
                .header("Origin", "http://sitio-ajeno.com")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}

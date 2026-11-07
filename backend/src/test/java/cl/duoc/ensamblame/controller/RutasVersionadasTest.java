package cl.duoc.ensamblame.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cl.duoc.ensamblame.exception.ResponseEntityHandler;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.security.UsuarioAutenticado;
import cl.duoc.ensamblame.service.BoletaService;
import cl.duoc.ensamblame.service.CategoriaService;
import cl.duoc.ensamblame.service.ProductoService;
import cl.duoc.ensamblame.service.UsuarioService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** Todas las rutas de la API cuelgan de /api/v1; la ruta sin version ya no existe. */
@ExtendWith(MockitoExtension.class)
class RutasVersionadasTest {

    @Mock
    private CategoriaService categoriaService;

    @Mock
    private ProductoService productoService;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private BoletaService boletaService;

    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CategoriaController(categoriaService),
                new ProductoController(productoService), new UsuarioController(usuarioService),
                new BoletaController(boletaService))
                .setControllerAdvice(new ResponseEntityHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        // Las boletas se consultan con sesion; las reglas de acceso estan en SeguridadWebTest.
        UsuarioAutenticado admin = new UsuarioAutenticado("190110222", "admin@duoc.cl", TipoUsuario.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(admin, null));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @ValueSource(strings = {"categorias", "productos", "usuarios", "boletas"})
    void cadaRecursoRespondeEnApiV1(String recurso) throws Exception {
        mockMvc.perform(get("/api/v1/" + recurso)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"categorias", "productos", "usuarios", "boletas"})
    void laRutaSinVersionYaNoExiste(String recurso) throws Exception {
        mockMvc.perform(get("/api/" + recurso)).andExpect(status().isNotFound());
    }
}

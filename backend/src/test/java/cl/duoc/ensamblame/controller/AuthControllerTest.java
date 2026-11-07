package cl.duoc.ensamblame.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cl.duoc.ensamblame.dto.request.LoginRequest;
import cl.duoc.ensamblame.dto.request.RefreshRequest;
import cl.duoc.ensamblame.dto.request.RegistroRequest;
import cl.duoc.ensamblame.dto.response.TokenResponse;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.exception.ResponseEntityHandler;
import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** Controlador y ResponseEntityHandler sin base de datos: el servicio es un mock. */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;

    private static final String REGISTRO_VALIDO = """
            {"run": "123456785", "nombre": "Camila", "apellidos": "Soto Vera", "correo": "camila@gmail.com",
             "contrasena": "cliente123", "region": "RM", "comuna": "RM-04", "direccion": "Irarrazaval 2550"}
            """;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new ResponseEntityHandler())
                .build();
    }

    @Test
    void loginCorrectoResponde200ConLosTokens() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new TokenResponse("acceso", "renovacion",
                "Bearer", 900, "123456785", "Camila", TipoUsuario.CLIENTE));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\": \"camila@gmail.com\", \"contrasena\": \"cliente123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("acceso"))
                .andExpect(jsonPath("$.refreshToken").value("renovacion"))
                .andExpect(jsonPath("$.rol").value("CLIENTE"))
                .andExpect(jsonPath("$.expiraEn").value(900));
    }

    @Test
    void loginConCredencialesIncorrectasResponde401ConElFormatoDeError() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Correo o contrasena incorrectos."));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\": \"camila@gmail.com\", \"contrasena\": \"mala\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.estado").value(401))
                .andExpect(jsonPath("$.mensaje").value("Correo o contrasena incorrectos."));
    }

    @Test
    void loginSinContrasenaResponde400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\": \"camila@gmail.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.contrasena").exists());
    }

    @Test
    void registroValidoResponde201() throws Exception {
        when(authService.registro(any(RegistroRequest.class))).thenReturn(new UsuarioResponse("123456785", "Camila",
                "Soto Vera", "camila@gmail.com", null, "RM", "RM-04", "Irarrazaval 2550", TipoUsuario.CLIENTE));

        mockMvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(REGISTRO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipoUsuario").value("CLIENTE"));
    }

    @Test
    void registroConUnCorreoRepetidoResponde409() throws Exception {
        when(authService.registro(any(RegistroRequest.class)))
                .thenThrow(new ReglaNegocioException("Ya existe un usuario con el correo camila@gmail.com."));

        mockMvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(REGISTRO_VALIDO))
                .andExpect(status().isConflict());
    }

    @Test
    void registroConDominioNoPermitidoResponde400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRO_VALIDO.replace("camila@gmail.com", "camila@hotmail.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.correo").exists());
    }

    @Test
    void renovarConUnTokenInvalidoResponde401() throws Exception {
        when(authService.refresh(any(RefreshRequest.class)))
                .thenThrow(new TokenInvalidoException("El token es invalido o esta vencido."));

        mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\": \"basura\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("El token es invalido o esta vencido."));
    }
}

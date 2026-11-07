package cl.duoc.ensamblame.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.duoc.ensamblame.dto.request.LoginRequest;
import cl.duoc.ensamblame.dto.request.RefreshRequest;
import cl.duoc.ensamblame.dto.request.RegistroRequest;
import cl.duoc.ensamblame.dto.request.UsuarioRequest;
import cl.duoc.ensamblame.dto.response.TokenResponse;
import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import cl.duoc.ensamblame.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioService usuarioService;

    // El servicio de tokens es real: lo que se comprueba es que las piezas encajen.
    private final JwtService jwtService = new JwtService("secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres", 15, 7);

    private AuthService servicio;

    @BeforeEach
    void preparar() {
        servicio = new AuthService(authenticationManager, usuarioRepository, usuarioService, jwtService);
    }

    private Usuario usuario(TipoUsuario rol) {
        Usuario usuario = new Usuario();
        usuario.setRun("123456785");
        usuario.setNombre("Camila");
        usuario.setCorreo("camila@gmail.com");
        usuario.setTipoUsuario(rol);
        return usuario;
    }

    @Test
    void loginCorrectoEntregaTokensYLosDatosDeLaSesion() {
        when(authenticationManager.authenticate(any())).thenReturn(org.mockito.Mockito.mock(Authentication.class));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.of(usuario(TipoUsuario.CLIENTE)));

        TokenResponse respuesta = servicio.login(new LoginRequest("camila@gmail.com", "cliente123"));

        assertEquals("Bearer", respuesta.tipo());
        assertEquals(900, respuesta.expiraEn());
        assertEquals("123456785", respuesta.run());
        assertEquals("Camila", respuesta.nombre());
        assertEquals(TipoUsuario.CLIENTE, respuesta.rol());
        assertEquals("123456785", jwtService.leerAcceso(respuesta.accessToken()).run());
        assertEquals("123456785", jwtService.leerRenovacion(respuesta.refreshToken()).run());
    }

    @Test
    void elLoginAceptaElCorreoConMayusculasYEspacios() {
        when(authenticationManager.authenticate(any())).thenReturn(org.mockito.Mockito.mock(Authentication.class));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.of(usuario(TipoUsuario.CLIENTE)));

        TokenResponse respuesta = servicio.login(new LoginRequest(" Camila@GMAIL.com ", "cliente123"));

        ArgumentCaptor<Authentication> credenciales = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(credenciales.capture());
        assertEquals("camila@gmail.com", credenciales.getValue().getName());
        assertEquals("123456785", respuesta.run());
    }

    @Test
    void conUnaContrasenaIncorrectaElErrorNoDiceQueFallo() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        BadCredentialsException error = assertThrows(BadCredentialsException.class,
                () -> servicio.login(new LoginRequest("camila@gmail.com", "mala")));

        assertEquals("Correo o contrasena incorrectos.", error.getMessage());
        verify(usuarioRepository, never()).findByCorreo(any());
    }

    @Test
    void conUnCorreoInexistenteElErrorEsElMismoQueConUnaContrasenaIncorrecta() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("no existe"));

        BadCredentialsException error = assertThrows(BadCredentialsException.class,
                () -> servicio.login(new LoginRequest("nadie@gmail.com", "cliente123")));

        assertEquals("Correo o contrasena incorrectos.", error.getMessage());
    }

    @Test
    void elRegistroPublicoSiempreCreaUnCliente() {
        RegistroRequest registro = new RegistroRequest("123456785", "Camila", "Soto Vera", "camila@gmail.com",
                "cliente123", null, "RM", "RM-04", "Irarrazaval 2550");

        servicio.registro(registro);

        ArgumentCaptor<UsuarioRequest> creado = ArgumentCaptor.forClass(UsuarioRequest.class);
        verify(usuarioService).crear(creado.capture());
        assertEquals(TipoUsuario.CLIENTE, creado.getValue().tipoUsuario());
        assertEquals("camila@gmail.com", creado.getValue().correo());
    }

    @Test
    void renovarEntregaTokensNuevosYTomaElRolActualDeLaBase() {
        String renovacion = jwtService.generarRenovacion(usuario(TipoUsuario.CLIENTE));
        // Desde que se emitio el token, el administrador le cambio el rol.
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(usuario(TipoUsuario.LOGISTICA)));

        TokenResponse respuesta = servicio.refresh(new RefreshRequest(renovacion));

        assertEquals(TipoUsuario.LOGISTICA, respuesta.rol());
        assertEquals(TipoUsuario.LOGISTICA, jwtService.leerAcceso(respuesta.accessToken()).rol());
    }

    @Test
    void renovarConUnTokenDeAccesoSeRechaza() {
        String acceso = jwtService.generarAcceso(usuario(TipoUsuario.CLIENTE));

        assertThrows(TokenInvalidoException.class, () -> servicio.refresh(new RefreshRequest(acceso)));
        verify(usuarioRepository, never()).findById(any());
    }

    @Test
    void renovarDeUnUsuarioQueYaNoExisteSeRechaza() {
        String renovacion = jwtService.generarRenovacion(usuario(TipoUsuario.CLIENTE));
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.empty());

        TokenInvalidoException error = assertThrows(TokenInvalidoException.class,
                () -> servicio.refresh(new RefreshRequest(renovacion)));

        assertTrue(error.getMessage().contains("invalido"));
    }
}

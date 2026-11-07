package cl.duoc.ensamblame.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.duoc.ensamblame.dto.request.PerfilRequest;
import cl.duoc.ensamblame.dto.request.UsuarioRequest;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.exception.SolicitudInvalidaException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import java.util.Arrays;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private BoletaRepository boletaRepository;

    private UsuarioService servicio;

    @BeforeEach
    void preparar() {
        servicio = new UsuarioService(usuarioRepository, passwordEncoder, boletaRepository);
    }

    private UsuarioRequest request(String run, String correo) {
        return new UsuarioRequest(run, "Camila", "Soto Vera", correo, "cliente123", null, "RM", "RM-04",
                "Irarrazaval 2550, Nunoa", TipoUsuario.CLIENTE);
    }

    @Test
    void crearCifraLaContrasenaAntesDeGuardar() {
        when(usuarioRepository.existsById("123456785")).thenReturn(false);
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("cliente123")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));

        servicio.crear(request("123456785", "camila@gmail.com"));

        ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(guardado.capture());
        assertEquals("hash-bcrypt", guardado.getValue().getContrasena());
    }

    @Test
    void laRespuestaNoIncluyeLaContrasena() {
        when(usuarioRepository.existsById("123456785")).thenReturn(false);
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("cliente123")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));

        UsuarioResponse respuesta = servicio.crear(request("123456785", "camila@gmail.com"));

        assertEquals("123456785", respuesta.run());
        // El record de respuesta no tiene un campo para la contrasena.
        boolean tieneContrasena = Arrays.stream(UsuarioResponse.class.getRecordComponents())
                .anyMatch(campo -> campo.getName().equals("contrasena"));
        assertFalse(tieneContrasena);
    }

    @Test
    void crearConUnDigitoVerificadorIncorrectoLanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class, () -> servicio.crear(request("123456786", "camila@gmail.com")));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearConUnRunRepetidoLanzaConflicto() {
        when(usuarioRepository.existsById("123456785")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.crear(request("123456785", "camila@gmail.com")));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearConUnCorreoRepetidoLanzaConflicto() {
        Usuario otro = new Usuario();
        otro.setRun("190110222");
        when(usuarioRepository.existsById("123456785")).thenReturn(false);
        when(usuarioRepository.findByCorreo("admin@duoc.cl")).thenReturn(Optional.of(otro));

        assertThrows(ReglaNegocioException.class, () -> servicio.crear(request("123456785", "admin@duoc.cl")));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void actualizarPuedeConservarSuPropioCorreo() {
        Usuario existente = new Usuario();
        existente.setRun("123456785");
        existente.setCorreo("camila@gmail.com");
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(existente));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.of(existente));
        when(passwordEncoder.encode("cliente123")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));

        UsuarioResponse respuesta = servicio.actualizar("123456785", request("123456785", "camila@gmail.com"));

        assertEquals("camila@gmail.com", respuesta.correo());
    }

    @Test
    void eliminarUnUsuarioConBoletasLanzaConflictoYNoLoBorra() {
        Usuario existente = new Usuario();
        existente.setRun("123456785");
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(existente));
        when(boletaRepository.existsByUsuarioRun("123456785")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.eliminar("123456785"));

        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    void eliminarUnUsuarioSinBoletasLoBorra() {
        Usuario existente = new Usuario();
        existente.setRun("123456785");
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(existente));

        servicio.eliminar("123456785");

        verify(usuarioRepository).delete(existente);
    }

    // --- Edicion del perfil propio ---

    private Usuario cuenta() {
        Usuario u = new Usuario();
        u.setRun("123456785");
        u.setNombre("Camila");
        u.setCorreo("camila@gmail.com");
        u.setContrasena("hash-actual");
        u.setTipoUsuario(TipoUsuario.CLIENTE);
        return u;
    }

    private PerfilRequest perfil(String correo, String actual, String nueva) {
        return new PerfilRequest("Camila", "Soto", correo, null, "RM", "RM-04", "Av. Nueva 100", actual, nueva);
    }

    @Test
    void elPerfilCambiaLosDatosPeroNuncaElRolNiElRun() {
        Usuario u = cuenta();
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(u));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.of(u));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));

        UsuarioResponse respuesta = servicio.actualizarPerfil("123456785", perfil("camila@gmail.com", null, null));

        assertEquals("Av. Nueva 100", respuesta.direccion());
        assertEquals(TipoUsuario.CLIENTE, respuesta.tipoUsuario());
        assertEquals("123456785", respuesta.run());
        assertEquals("hash-actual", u.getContrasena());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void elPerfilNoPuedeTomarElCorreoDeOtraCuenta() {
        Usuario otra = cuenta();
        otra.setRun("187654321");
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(cuenta()));
        when(usuarioRepository.findByCorreo("bodega@duoc.cl")).thenReturn(Optional.of(otra));

        assertThrows(ReglaNegocioException.class,
                () -> servicio.actualizarPerfil("123456785", perfil("bodega@duoc.cl", null, null)));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void cambiarLaContrasenaExigeLaActual() {
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(cuenta()));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.matches("equivocada", "hash-actual")).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.actualizarPerfil("123456785", perfil("camila@gmail.com", "equivocada", "nueva1234")));
        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.actualizarPerfil("123456785", perfil("camila@gmail.com", null, "nueva1234")));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void conLaContrasenaActualCorrectaSeGuardaLaNuevaCifrada() {
        Usuario u = cuenta();
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(u));
        when(usuarioRepository.findByCorreo("camila@gmail.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("cliente123", "hash-actual")).thenReturn(true);
        when(passwordEncoder.encode("nueva1234")).thenReturn("hash-nuevo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));

        servicio.actualizarPerfil("123456785", perfil("camila@gmail.com", "cliente123", "nueva1234"));

        assertEquals("hash-nuevo", u.getContrasena());
    }
}

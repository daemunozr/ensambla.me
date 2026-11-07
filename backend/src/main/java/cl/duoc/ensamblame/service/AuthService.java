package cl.duoc.ensamblame.service;

import cl.duoc.ensamblame.dto.request.LoginRequest;
import cl.duoc.ensamblame.dto.request.RefreshRequest;
import cl.duoc.ensamblame.dto.request.RegistroRequest;
import cl.duoc.ensamblame.dto.request.UsuarioRequest;
import cl.duoc.ensamblame.dto.response.TokenResponse;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import cl.duoc.ensamblame.security.JwtService;
import cl.duoc.ensamblame.security.UsuarioAutenticado;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
            UsuarioService usuarioService, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    /** Valida correo y contrasena (BCrypt) y entrega los tokens. El mismo error sirve para ambos fallos. */
    public TokenResponse login(LoginRequest request) {
        String correo = UsuarioService.normalizarCorreo(request.correo());
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(correo, request.contrasena()));
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Correo o contrasena incorrectos.");
        }
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new BadCredentialsException("Correo o contrasena incorrectos."));
        return aTokens(usuario);
    }

    /** El registro publico siempre crea un Cliente, sin importar lo que mande el cuerpo. */
    public UsuarioResponse registro(RegistroRequest request) {
        return usuarioService.crear(new UsuarioRequest(request.run(), request.nombre(), request.apellidos(),
                request.correo(), request.contrasena(), request.fechaNacimiento(), request.region(),
                request.comuna(), request.direccion(), TipoUsuario.CLIENTE));
    }

    /** Canjea un token de renovacion por tokens nuevos. El usuario debe seguir existiendo; su rol se toma de la base. */
    public TokenResponse refresh(RefreshRequest request) {
        UsuarioAutenticado quien = jwtService.leerRenovacion(request.refreshToken());
        Usuario usuario = usuarioRepository.findById(quien.run())
                .orElseThrow(() -> new TokenInvalidoException("El token es invalido o esta vencido."));
        return aTokens(usuario);
    }

    private TokenResponse aTokens(Usuario usuario) {
        return new TokenResponse(jwtService.generarAcceso(usuario), jwtService.generarRenovacion(usuario),
                "Bearer", jwtService.segundosDeAcceso(), usuario.getRun(), usuario.getNombre(),
                usuario.getTipoUsuario());
    }
}

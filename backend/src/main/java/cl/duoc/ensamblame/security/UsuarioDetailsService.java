package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Busca al usuario por correo para que Spring Security compare la contrasena (BCrypt) al iniciar sesion. */
@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .map(usuario -> User.withUsername(usuario.getCorreo())
                        .password(usuario.getContrasena())
                        .roles(usuario.getTipoUsuario().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("No existe el usuario " + correo + "."));
    }
}

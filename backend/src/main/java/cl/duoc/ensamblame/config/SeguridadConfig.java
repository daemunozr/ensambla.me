package cl.duoc.ensamblame.config;

import cl.duoc.ensamblame.security.AccesoDenegadoHandler;
import cl.duoc.ensamblame.security.AuthEntryPoint;
import cl.duoc.ensamblame.security.JwtAuthFilter;
import cl.duoc.ensamblame.security.JwtService;
import cl.duoc.ensamblame.security.UsuarioDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Seguridad de la API: sin sesiones (cada peticion trae su token JWT) y con los permisos de cada
 * ruta por rol, todos en un solo lugar.
 */
@Configuration
public class SeguridadConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Valida correo y contrasena contra la base, comparando el hash BCrypt. */
    @Bean
    public AuthenticationManager authenticationManager(UsuarioDetailsService usuarios,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider proveedor = new DaoAuthenticationProvider(usuarios);
        proveedor.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(proveedor);
    }

    @Bean
    public SecurityFilterChain filtros(HttpSecurity http, JwtService jwtService, AuthEntryPoint entryPoint,
            AccesoDenegadoHandler accesoDenegado) throws Exception {
        http
                // Sin cookies ni sesion: el token va en la cabecera, asi que no hay CSRF que prevenir.
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Usa las reglas de CorsConfig; responde antes los preflight (OPTIONS).
                .cors(Customizer.withDefaults())
                .exceptionHandling(errores -> errores
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accesoDenegado))
                .authorizeHttpRequests(rutas -> rutas
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Documentacion de la API (Swagger UI y especificacion OpenAPI).
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Catalogo publico: cualquiera lo ve, solo el administrador lo modifica.
                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias/**", "/api/v1/productos/**").permitAll()
                        .requestMatchers("/api/v1/categorias/**", "/api/v1/productos/**").hasRole("ADMIN")
                        // Comprar no exige sesion; con token, la boleta queda a nombre de la cuenta.
                        .requestMatchers(HttpMethod.POST, "/api/v1/boletas").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/boletas/**").hasAnyRole("ADMIN", "LOGISTICA", "CLIENTE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/usuarios/me").authenticated()
                        .requestMatchers("/api/v1/usuarios/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService, entryPoint), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}

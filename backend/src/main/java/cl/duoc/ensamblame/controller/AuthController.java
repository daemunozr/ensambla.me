package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.LoginRequest;
import cl.duoc.ensamblame.dto.request.RefreshRequest;
import cl.duoc.ensamblame.dto.request.RegistroRequest;
import cl.duoc.ensamblame.dto.response.TokenResponse;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rutas publicas para entrar al sistema: iniciar sesion, registrarse y renovar el token. */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registro(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registro(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }
}

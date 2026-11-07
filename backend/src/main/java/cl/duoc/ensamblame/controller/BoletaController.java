package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.security.UsuarioAutenticado;
import cl.duoc.ensamblame.service.BoletaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Una boleta se registra y se consulta, pero no se edita ni se elimina. */
@RestController
@RequestMapping("/api/v1/boletas")
public class BoletaController {

    private final BoletaService boletaService;

    public BoletaController(BoletaService boletaService) {
        this.boletaService = boletaService;
    }

    // GET /api/v1/boletas   o   GET /api/v1/boletas?usuario=123456785 (solo el personal puede filtrar)
    // Un cliente solo ve sus boletas: se ignora el filtro y se usa su RUN.
    @GetMapping
    public ResponseEntity<List<BoletaResponse>> listar(@RequestParam(required = false) String usuario,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        String restringidoA = restringirA(actual);
        return ResponseEntity.ok(boletaService.listar(restringidoA != null ? restringidoA : usuario));
    }

    @GetMapping("/{numero}")
    public ResponseEntity<BoletaResponse> obtener(@PathVariable String numero,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        return ResponseEntity.ok(boletaService.obtener(numero, restringirA(actual)));
    }

    // Sin token (actual == null) la compra es de invitado; con token queda a nombre de la cuenta.
    @PostMapping
    public ResponseEntity<BoletaResponse> crear(@Valid @RequestBody BoletaRequest request,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        String run = actual != null ? actual.run() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(boletaService.crear(request, run));
    }

    // RUN al que se limita la consulta: el del cliente, o null si es personal (ve todo).
    // La seguridad ya exige sesion en estas rutas; si faltara, se corta aqui en vez de mostrar todo.
    private String restringirA(UsuarioAutenticado actual) {
        if (actual == null) {
            throw new TokenInvalidoException("Debes iniciar sesion para usar este recurso.");
        }
        return actual.rol() == TipoUsuario.CLIENTE ? actual.run() : null;
    }
}

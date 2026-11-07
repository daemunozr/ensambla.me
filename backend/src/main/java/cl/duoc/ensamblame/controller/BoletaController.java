package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.service.BoletaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    // GET /api/v1/boletas   o   GET /api/v1/boletas?usuario=123456785 (solo las de esa cuenta)
    @GetMapping
    public ResponseEntity<List<BoletaResponse>> listar(@RequestParam(required = false) String usuario) {
        return ResponseEntity.ok(boletaService.listar(usuario));
    }

    @GetMapping("/{numero}")
    public ResponseEntity<BoletaResponse> obtener(@PathVariable String numero) {
        return ResponseEntity.ok(boletaService.obtener(numero));
    }

    @PostMapping
    public ResponseEntity<BoletaResponse> crear(@Valid @RequestBody BoletaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boletaService.crear(request));
    }
}

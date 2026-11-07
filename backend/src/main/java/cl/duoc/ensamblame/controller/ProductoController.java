package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.ProductoRequest;
import cl.duoc.ensamblame.dto.response.ProductoResponse;
import cl.duoc.ensamblame.service.ProductoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // GET /api/v1/productos?categoria=cpu   o   GET /api/v1/productos?q=ryzen
    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(productoService.listar(categoria, q));
    }

    @GetMapping("/{sku}")
    public ResponseEntity<ProductoResponse> obtener(@PathVariable String sku) {
        return ResponseEntity.ok(productoService.obtener(sku));
    }

    @PostMapping
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{sku}")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable String sku,
            @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(sku, request));
    }

    @DeleteMapping("/{sku}")
    public ResponseEntity<Void> eliminar(@PathVariable String sku) {
        productoService.eliminar(sku);
        return ResponseEntity.noContent().build();
    }
}

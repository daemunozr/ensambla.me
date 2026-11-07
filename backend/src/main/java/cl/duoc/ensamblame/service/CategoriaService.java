package cl.duoc.ensamblame.service;

import cl.duoc.ensamblame.dto.request.CategoriaRequest;
import cl.duoc.ensamblame.dto.response.CategoriaResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Categoria;
import cl.duoc.ensamblame.repository.CategoriaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriaService(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    public List<CategoriaResponse> listar() {
        return categoriaRepository.findAll().stream().map(this::aResponse).toList();
    }

    public CategoriaResponse obtener(String codigo) {
        return aResponse(buscar(codigo));
    }

    public CategoriaResponse crear(CategoriaRequest request) {
        if (categoriaRepository.existsById(request.codigo())) {
            throw new ReglaNegocioException("Ya existe una categoria con el codigo " + request.codigo() + ".");
        }
        Categoria categoria = new Categoria(request.codigo(), request.nombre(), request.orden());
        return aResponse(categoriaRepository.save(categoria));
    }

    /** El codigo identifica a la categoria y no cambia: se ignora el del cuerpo. */
    public CategoriaResponse actualizar(String codigo, CategoriaRequest request) {
        Categoria categoria = buscar(codigo);
        categoria.setNombre(request.nombre());
        categoria.setOrden(request.orden());
        return aResponse(categoriaRepository.save(categoria));
    }

    /**
     * No se elimina una categoria con productos ni una con "orden": es un paso del asistente de armado,
     * que en modo equipo completo exige una opcion en cada paso.
     */
    public void eliminar(String codigo) {
        Categoria categoria = buscar(codigo);
        if (categoria.getOrden() != null) {
            throw new ReglaNegocioException("La categoria " + categoria.getNombre() + " es el paso "
                    + categoria.getOrden() + " del asistente de armado y no se puede eliminar.");
        }
        if (productoRepository.existsByCategoriaCodigo(codigo)) {
            throw new ReglaNegocioException("No se puede eliminar la categoria " + codigo + ": tiene productos.");
        }
        categoriaRepository.delete(categoria);
    }

    private Categoria buscar(String codigo) {
        return categoriaRepository.findById(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la categoria " + codigo + "."));
    }

    private CategoriaResponse aResponse(Categoria categoria) {
        return new CategoriaResponse(categoria.getCodigo(), categoria.getNombre(), categoria.getOrden());
    }
}

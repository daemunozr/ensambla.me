package cl.duoc.ensamblame.repository;

import cl.duoc.ensamblame.model.Boleta;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoletaRepository extends JpaRepository<Boleta, String> {

    // De la mas reciente a la mas antigua.
    List<Boleta> findAllByOrderByFechaDescNumeroDesc();

    List<Boleta> findByUsuarioRunOrderByFechaDescNumeroDesc(String run);

    // La ultima boleta de un ano (prefijo "ORD-2026-"), para calcular el siguiente correlativo.
    Optional<Boleta> findFirstByNumeroStartingWithOrderByNumeroDesc(String prefijo);

    boolean existsByUsuarioRun(String run);

    boolean existsByDetallesProductoSku(String sku);
}

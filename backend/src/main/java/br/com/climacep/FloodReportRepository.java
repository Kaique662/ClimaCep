package br.com.climacep;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FloodReportRepository extends JpaRepository<FloodReport, Long> {
    @Query("select f from FloodReport f where f.user.id = :userId and f.cep = :cep")
    Optional<FloodReport> findByUserIdAndCep(@Param("userId") Long userId, @Param("cep") String cep);
    List<FloodReport> findTop30ByCepAndUpdatedAtGreaterThanEqualOrderByUpdatedAtDesc(String cep, Instant since);
    long countByCepAndStatusAndUpdatedAtGreaterThanEqual(String cep, FloodStatus status, Instant since);
}

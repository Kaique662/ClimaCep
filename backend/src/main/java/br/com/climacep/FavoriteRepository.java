package br.com.climacep;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndCep(Long userId, String cep);
    java.util.Optional<Favorite> findByIdAndUserId(Long id, Long userId);
}

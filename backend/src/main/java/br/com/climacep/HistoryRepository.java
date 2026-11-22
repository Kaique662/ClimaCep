package br.com.climacep;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface HistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);
    java.util.Optional<SearchHistory> findByIdAndUserId(Long id, Long userId);
    @Modifying @Query("delete from SearchHistory h where h.user.id = :userId")
    void deleteAllForUser(@Param("userId") Long userId);
}

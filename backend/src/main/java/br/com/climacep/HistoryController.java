package br.com.climacep;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController @RequestMapping("/api/history")
public class HistoryController {
    private final HistoryRepository history;
    private final CurrentUser current;
    public HistoryController(HistoryRepository history, CurrentUser current) {
        this.history = history; this.current = current;
    }
    @GetMapping @Transactional(readOnly = true)
    public List<HistoryResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return history.findTop30ByUserIdOrderByCreatedAtDesc(current.from(jwt).getId())
            .stream().map(HistoryResponse::from).toList();
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
    public HistoryResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody HistoryRequest req) {
        return HistoryResponse.from(history.save(new SearchHistory(current.from(jwt), req.cep(),
            req.neighborhood(), req.city(), req.state(), req.temperature())));
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        SearchHistory item = history.findByIdAndUserId(id, current.from(jwt).getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesquisa não encontrada."));
        history.delete(item);
    }
    @DeleteMapping @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteAll(@AuthenticationPrincipal Jwt jwt) { history.deleteAllForUser(current.from(jwt).getId()); }
}

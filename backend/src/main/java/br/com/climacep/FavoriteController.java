package br.com.climacep;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController @RequestMapping("/api/favorites")
public class FavoriteController {
    private final FavoriteRepository favorites;
    private final CurrentUser current;
    public FavoriteController(FavoriteRepository favorites, CurrentUser current) {
        this.favorites = favorites; this.current = current;
    }
    @GetMapping @Transactional(readOnly = true)
    public List<FavoriteResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return favorites.findByUserIdOrderByCreatedAtDesc(current.from(jwt).getId())
            .stream().map(FavoriteResponse::from).toList();
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
    public FavoriteResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody FavoriteRequest req) {
        AppUser user = current.from(jwt);
        if (favorites.existsByUserIdAndCep(user.getId(), req.cep()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este CEP já está nos favoritos.");
        Favorite f = favorites.save(new Favorite(user, req.cep(), req.nickname().trim(),
            req.neighborhood(), req.city(), req.state()));
        return FavoriteResponse.from(f);
    }
    @PutMapping("/{id}") @Transactional
    public FavoriteResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                   @Valid @RequestBody FavoriteUpdateRequest req) {
        Favorite favorite = ownFavorite(jwt, id);
        favorite.update(req.nickname().trim(), req.neighborhood(), req.city(), req.state());
        return FavoriteResponse.from(favorite);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        favorites.delete(ownFavorite(jwt, id));
    }
    private Favorite ownFavorite(Jwt jwt, Long id) {
        return favorites.findByIdAndUserId(id, current.from(jwt).getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorito não encontrado."));
    }
}

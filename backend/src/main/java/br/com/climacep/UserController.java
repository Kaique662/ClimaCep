package br.com.climacep;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/users")
public class UserController {
    private final CurrentUser current;
    private final PasswordEncoder passwords;
    public UserController(CurrentUser current, PasswordEncoder passwords) {
        this.current = current; this.passwords = passwords;
    }
    @GetMapping("/me") @Transactional(readOnly = true)
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) { return UserResponse.from(current.from(jwt)); }
    @PutMapping("/me") @Transactional
    public UserResponse update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateUserRequest req) {
        AppUser user = current.from(jwt);
        user.setName(req.name().trim());
        return UserResponse.from(user);
    }
    @PutMapping("/me/password") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void password(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PasswordRequest req) {
        AppUser user = current.from(jwt);
        if (!passwords.matches(req.currentPassword(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta.");
        user.setPasswordHash(passwords.encode(req.newPassword()));
    }
}

package br.com.climacep;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final long expirationHours;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtEncoder jwtEncoder,
                       @Value("${app.jwt.expiration-hours:12}") long expirationHours) {
        this.users = users; this.encoder = encoder; this.jwtEncoder = jwtEncoder; this.expirationHours = expirationHours;
    }
    private static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalizeEmail(req.email());
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        AppUser user = users.save(new AppUser(req.name().trim(), email, encoder.encode(req.password())));
        return createToken(user);
    }
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        AppUser user = users.findByEmail(normalizeEmail(req.email()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));
        if (!encoder.matches(req.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        return createToken(user);
    }
    private AuthResponse createToken(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("climacep").subject(user.getId().toString())
            .issuedAt(now).expiresAt(now.plus(expirationHours, ChronoUnit.HOURS))
            .claim("email", user.getEmail()).build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", UserResponse.from(user));
    }
}

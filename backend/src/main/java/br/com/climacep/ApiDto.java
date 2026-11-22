package br.com.climacep;

import jakarta.validation.constraints.*;
import java.time.Instant;

final class ApiDto { private ApiDto() {} }

record RegisterRequest(@NotBlank @Size(max = 120) String name,
                       @NotBlank @Email @Size(max = 160) String email,
                       @NotBlank @Size(min = 8, max = 72) String password) {}
record LoginRequest(@NotBlank String email, @NotBlank String password) {}
record UserResponse(Long id, String name, String email) {
    static UserResponse from(AppUser user) { return new UserResponse(user.getId(), user.getName(), user.getEmail()); }
}
record AuthResponse(String accessToken, String tokenType, UserResponse user) {}
record UpdateUserRequest(@NotBlank @Size(max = 120) String name) {}
record PasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 8, max = 72) String newPassword) {}
record FavoriteRequest(@NotBlank @Pattern(regexp="[0-9]{8}") String cep,
                       @NotBlank @Size(max = 80) String nickname,
                       @Size(max = 120) String neighborhood,
                       @Size(max = 120) String city,
                       @Pattern(regexp = "[A-Za-z]{2}") String state) {}
record FavoriteUpdateRequest(@NotBlank @Size(max = 80) String nickname,
                             @Size(max = 120) String neighborhood,
                             @Size(max = 120) String city,
                             @Pattern(regexp="[A-Za-z]{2}") String state) {}
record FavoriteResponse(Long id, String cep, String nickname, String neighborhood,
                        String city, String state, Instant createdAt) {
    static FavoriteResponse from(Favorite f) {
        return new FavoriteResponse(f.getId(), f.getCep(), f.getNickname(),
            f.getNeighborhood(), f.getCity(), f.getState(), f.getCreatedAt());
    }
}
record HistoryRequest(@NotBlank @Pattern(regexp="[0-9]{8}") String cep,
                      @Size(max = 120) String neighborhood,
                      @Size(max = 120) String city,
                      @Pattern(regexp="[A-Za-z]{2}") String state,
                      Double temperature) {}
record HistoryResponse(Long id, String cep, String neighborhood, String city,
                       String state, Double temperature, Instant createdAt) {
    static HistoryResponse from(SearchHistory h) {
        return new HistoryResponse(h.getId(), h.getCep(), h.getNeighborhood(),
            h.getCity(), h.getState(), h.getTemperature(), h.getCreatedAt());
    }
}

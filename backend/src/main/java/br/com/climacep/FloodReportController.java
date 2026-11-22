package br.com.climacep;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

record FloodReportRequest(
    @NotNull FloodStatus status,
    @Size(max = 280) String note,
    @Size(max = 120) String neighborhood,
    @Size(max = 120) String city,
    @Pattern(regexp = "[A-Za-z]{2}") String state
) {}

record FloodReportResponse(
    Long id, String cep, String status, String note,
    String neighborhood, String city, String state,
    Instant updatedAt, boolean mine
) {
    static FloodReportResponse from(FloodReport item, Long currentUserId) {
        return new FloodReportResponse(item.getId(), item.getCep(), item.getStatus().name(),
            item.getNote(), item.getNeighborhood(), item.getCity(), item.getState(),
            item.getUpdatedAt(), item.getUserId().equals(currentUserId));
    }
}

record FloodSummaryResponse(
    String cep, int windowHours, long floodedCount, long clearCount,
    String situation, FloodReportResponse myReport, List<FloodReportResponse> reports
) {}

@RestController
@RequestMapping("/api/flood-reports")
public class FloodReportController {
    private final FloodReportRepository reports;
    private final CurrentUser current;
    public FloodReportController(FloodReportRepository reports, CurrentUser current) {
        this.reports = reports;
        this.current = current;
    }

    private static String validatedCep(String cep) {
        if (cep == null || !cep.matches("[0-9]{8}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O CEP deve conter 8 números.");
        return cep;
    }

    @GetMapping @Transactional(readOnly = true)
    public FloodSummaryResponse list(@AuthenticationPrincipal Jwt jwt, @RequestParam String cep) {
        String checkedCep = validatedCep(cep);
        Long userId = current.from(jwt).getId();
        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        long flood = reports.countByCepAndStatusAndUpdatedAtGreaterThanEqual(checkedCep, FloodStatus.FLOODED, since);
        long clear = reports.countByCepAndStatusAndUpdatedAtGreaterThanEqual(checkedCep, FloodStatus.CLEAR, since);
        String situation = flood > 0 && clear > 0 ? "CONFLICTING"
            : flood > 0 ? "REPORTED_FLOOD" : clear > 0 ? "REPORTED_CLEAR" : "NO_REPORTS";
        FloodReportResponse myReport = reports.findByUserIdAndCep(userId, checkedCep)
            .map(item -> FloodReportResponse.from(item, userId)).orElse(null);
        List<FloodReportResponse> recent = reports.findTop30ByCepAndUpdatedAtGreaterThanEqualOrderByUpdatedAtDesc(checkedCep, since)
            .stream().map(item -> FloodReportResponse.from(item, userId)).toList();
        return new FloodSummaryResponse(checkedCep, 24, flood, clear, situation, myReport, recent);
    }

    // Upsert: cada usuário mantém um único relato por CEP, que pode ser corrigido.
    @PutMapping("/my/{cep}") @Transactional
    public FloodReportResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable String cep,
                                    @Valid @RequestBody FloodReportRequest request) {
        String checkedCep = validatedCep(cep);
        AppUser user = current.from(jwt);
        FloodReport item = reports.findByUserIdAndCep(user.getId(), checkedCep)
            .orElseGet(() -> new FloodReport(user, checkedCep));
        item.apply(request);
        return FloodReportResponse.from(reports.saveAndFlush(item), user.getId());
    }

    @DeleteMapping("/my/{cep}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void remove(@AuthenticationPrincipal Jwt jwt, @PathVariable String cep) {
        String checkedCep = validatedCep(cep);
        FloodReport item = reports.findByUserIdAndCep(current.from(jwt).getId(), checkedCep)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Você não possui relato neste CEP."));
        reports.delete(item);
    }
}

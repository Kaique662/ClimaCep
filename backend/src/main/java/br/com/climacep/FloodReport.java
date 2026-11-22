package br.com.climacep;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "flood_reports", uniqueConstraints = @UniqueConstraint(
    name = "uq_flood_report_user_cep", columnNames = {"user_id", "cep"}))
public class FloodReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false) private AppUser user;
    @Column(nullable = false, length = 8) private String cep;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private FloodStatus status;
    @Column(length = 280) private String note;
    @Column(length = 120) private String neighborhood;
    @Column(length = 120) private String city;
    @Column(length = 2) private String state;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected FloodReport() {}
    public FloodReport(AppUser user, String cep) { this.user = user; this.cep = cep; }
    @PrePersist void created() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public void apply(FloodReportRequest request) {
        this.status = request.status();
        this.note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
        this.neighborhood = request.neighborhood() == null ? null : request.neighborhood().trim();
        this.city = request.city() == null ? null : request.city().trim();
        this.state = request.state() == null ? null : request.state().trim().toUpperCase();
    }
    public Long getId() { return id; }
    public Long getUserId() { return user.getId(); }
    public String getCep() { return cep; }
    public FloodStatus getStatus() { return status; }
    public String getNote() { return note; }
    public String getNeighborhood() { return neighborhood; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

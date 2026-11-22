package br.com.climacep;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "search_history")
public class SearchHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private AppUser user;
    @Column(nullable = false, length = 8) private String cep;
    @Column(length = 120) private String neighborhood;
    @Column(length = 120) private String city;
    @Column(length = 2) private String state;
    private Double temperature;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    protected SearchHistory() {}
    public SearchHistory(AppUser user, String cep, String neighborhood, String city, String state, Double temperature) {
        this.user = user; this.cep = cep; this.neighborhood = neighborhood; this.city = city;
        this.state = state; this.temperature = temperature;
    }
    public Long getId() { return id; }
    public String getCep() { return cep; }
    public String getNeighborhood() { return neighborhood; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public Double getTemperature() { return temperature; }
    public Instant getCreatedAt() { return createdAt; }
}

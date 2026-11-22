package br.com.climacep;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "favorites", uniqueConstraints = @UniqueConstraint(name = "uq_favorite_user_cep", columnNames = {"user_id", "cep"}))
public class Favorite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private AppUser user;
    @Column(nullable = false, length = 8) private String cep;
    @Column(nullable = false, length = 80) private String nickname;
    @Column(length = 120) private String neighborhood;
    @Column(length = 120) private String city;
    @Column(length = 2) private String state;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    protected Favorite() {}
    public Favorite(AppUser user, String cep, String nickname, String neighborhood, String city, String state) {
        this.user = user; this.cep = cep; this.nickname = nickname;
        this.neighborhood = neighborhood; this.city = city; this.state = state;
    }
    public Long getId() { return id; }
    public String getCep() { return cep; }
    public String getNickname() { return nickname; }
    public String getNeighborhood() { return neighborhood; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public Instant getCreatedAt() { return createdAt; }
    public void update(String nickname, String neighborhood, String city, String state) {
        this.nickname = nickname; this.neighborhood = neighborhood; this.city = city; this.state = state;
    }
}

package com.polytech.paqbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "plant")
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    @JsonIgnore
    private Site site;



    public Plant() {}


    public Plant(String name, Site site) {
        this.name = name;
        this.site = site;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Site getSite() { return site; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSite(Site site) { this.site = site; }
}
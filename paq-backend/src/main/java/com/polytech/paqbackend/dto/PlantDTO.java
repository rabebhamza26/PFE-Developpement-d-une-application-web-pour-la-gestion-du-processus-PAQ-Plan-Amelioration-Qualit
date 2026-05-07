package com.polytech.paqbackend.dto;

public class PlantDTO {
    private Long id;
    private String name;
    private Long siteId;
    private String siteName;

    // Constructeur par défaut (OBLIGATOIRE)
    public PlantDTO() {
    }

    public PlantDTO(Long id, String name, Long siteId, String siteName) {
        this.id = id;
        this.name = name;
        this.siteId = siteId;
        this.siteName = siteName;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getSiteId() { return siteId; }
    public String getSiteName() { return siteName; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
}

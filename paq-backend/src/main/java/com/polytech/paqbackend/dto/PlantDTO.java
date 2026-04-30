package com.polytech.paqbackend.dto;

public class PlantDTO {
    private Long id;
    private String name;
    private Long siteId;
    private String siteName;

    public PlantDTO(Long id, String name, Long siteId, String siteName) {
        this.id = id;
        this.name = name;
        this.siteId = siteId;
        this.siteName = siteName;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getSiteId() { return siteId; }
    public String getSiteName() { return siteName; }
}

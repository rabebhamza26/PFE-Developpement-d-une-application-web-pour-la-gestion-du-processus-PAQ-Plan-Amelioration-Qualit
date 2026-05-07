package com.polytech.paqbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteUserDistributionDTO {
    private Long siteId;
    private String siteName;
    private Long userCount;
}
package com.polytech.paqbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantDTO {
    private Long id;
    private String name;
    private Long siteId;
    private String siteName;
    private List<SegmentDTO> segments;
}
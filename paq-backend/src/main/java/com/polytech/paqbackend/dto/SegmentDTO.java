package com.polytech.paqbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SegmentDTO {
    private Long id;
    private String nomSegment;
    private Long plantId;
    private String plantName;
    private Long siteId;
    private String siteName;
}
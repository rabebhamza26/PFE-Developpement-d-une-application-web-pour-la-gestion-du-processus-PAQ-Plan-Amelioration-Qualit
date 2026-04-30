package com.polytech.paqbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SegmentDTO {
    private Long id;
    private String nomSegment;
}
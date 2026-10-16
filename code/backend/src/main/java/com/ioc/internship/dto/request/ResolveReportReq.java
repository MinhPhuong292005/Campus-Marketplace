package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveReportReq {

    @NotBlank(message = "Hành động xử lý không được để trống")
    private String action; // PENALIZE_KARMA, BAN_USER, REMOVE_LISTING, REJECTED

    private Integer karmaPenalty; // e.g. 15 for bom hẹn

    @NotBlank(message = "Nội dung kết luận không được để trống")
    private String resolutionNotes;
}

package com.ioc.internship.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingUpdateReq {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(min = 5, max = 255, message = "Tiêu đề phải từ 5 đến 255 ký tự")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    @Size(min = 10, message = "Mô tả tối thiểu 10 ký tự")
    private String description;

    @NotNull(message = "Vui lòng chọn danh mục")
    private Long categoryId;

    @NotNull(message = "Giá tiền không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá không được là số âm")
    private BigDecimal price;

    @NotBlank(message = "Vui lòng chọn tình trạng sản phẩm")
    @Pattern(regexp = "NEW_100|LIKE_NEW_99|GOOD_90|FAIR_70", message = "Tình trạng không hợp lệ")
    private String conditionStatus;

    private String rentalTerms;
    private BigDecimal depositAmount;
    private String swapTarget;
    private String safeMeetingPoint;

    @Size(max = 6, message = "Chỉ được upload tối đa 6 hình ảnh")
    private List<String> imageUrls;
}

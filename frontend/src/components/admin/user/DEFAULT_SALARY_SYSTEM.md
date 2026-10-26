# Hệ thống lương mặc định theo loại nhân viên

## Tổng quan

Hệ thống tự động thiết lập giá trị lương mặc định cho từng loại nhân viên ngay khi form được khởi tạo và khi thay đổi loại nhân viên.

## 1. Giá trị mặc định theo loại nhân viên

### **Nhân viên chính thức (Official)**

```typescript
{
  salary: 15000000,     // 15 triệu VNĐ - Lương cơ bản
  allowance: 500000,    // 500k VNĐ - Phụ cấp
  bonus: 1000000        // 1 triệu VNĐ - Thưởng
}
```

### **Nhân viên hợp đồng (Contract)**

```typescript
{
  salary: 12000000,     // 12 triệu VNĐ - Lương cơ bản
  allowance: 300000,    // 300k VNĐ - Phụ cấp
  bonus: 500000         // 500k VNĐ - Thưởng
}
```

### **Thực tập sinh (Intern)**

```typescript
{
  salary: 0,            // 0 VNĐ - Không có lương cơ bản
  allowance: 3000000,   // 3 triệu VNĐ - Trợ cấp thực tập
  bonus: 200000         // 200k VNĐ - Thưởng
}
```

## 2. Logic hoạt động

### **Khi tạo user mới:**

1. Form khởi tạo với `employeeType = "official"`
2. Tự động thiết lập lương mặc định cho nhân viên chính thức
3. Khi thay đổi loại nhân viên → Tự động cập nhật lương theo loại mới

### **Khi cập nhật user:**

1. Form hiển thị giá trị lương hiện tại từ database
2. Khi thay đổi loại nhân viên → Tự động cập nhật lương theo loại mới
3. Có thể chỉnh sửa thủ công sau khi tự động điền

### **Khi thay đổi loại nhân viên:**

```typescript
const handleEmployeeTypeChange = (value: string) => {
  // Luôn tự động thiết lập giá trị mặc định khi thay đổi loại nhân viên
  setDefaultSalaryValues(value);
};
```

## 3. Hàm thiết lập giá trị mặc định

```typescript
const setDefaultSalaryValues = (employeeType: string) => {
  switch (employeeType) {
    case "official":
      form.setFieldsValue({
        salary: 15000000,
        allowance: 500000,
        bonus: 1000000,
      });
      break;
    case "contract":
      form.setFieldsValue({
        salary: 12000000,
        allowance: 300000,
        bonus: 500000,
      });
      break;
    case "intern":
      form.setFieldsValue({
        salary: 0,
        allowance: 3000000,
        bonus: 200000,
      });
      break;
    default:
      form.setFieldsValue({
        salary: 15000000,
        allowance: 500000,
        bonus: 1000000,
      });
      break;
  }
};
```

## 4. Initial Values logic

```typescript
initialValues={{
    // ... các trường khác
    employeeType: dataInit?.employeeType || "official",

    // Thiết lập giá trị lương mặc định theo loại nhân viên
    salary: dataInit?.salary ?? (() => {
        const employeeType = dataInit?.employeeType || "official";
        switch (employeeType) {
            case 'official': return 15000000;
            case 'contract': return 12000000;
            case 'intern': return 0;
            default: return 15000000;
        }
    })(),

    allowance: dataInit?.allowance ?? (() => {
        const employeeType = dataInit?.employeeType || "official";
        switch (employeeType) {
            case 'official': return 500000;
            case 'contract': return 300000;
            case 'intern': return 3000000;
            default: return 500000;
        }
    })(),

    bonus: dataInit?.bonus ?? (() => {
        const employeeType = dataInit?.employeeType || "official";
        switch (employeeType) {
            case 'official': return 1000000;
            case 'contract': return 500000;
            case 'intern': return 200000;
            default: return 1000000;
        }
    })(),
}}
```

## 5. Luồng hoạt động

### **Tạo user mới:**

1. Mở modal → `employeeType = "official"` (mặc định)
2. Form tự động điền: 15M lương + 500k phụ cấp + 1M thưởng
3. Chọn loại khác → Tự động cập nhật lương theo loại mới
4. Có thể chỉnh sửa thủ công
5. Submit → Lưu vào database

### **Cập nhật user:**

1. Mở modal → Hiển thị giá trị lương hiện tại
2. Thay đổi loại nhân viên → Tự động cập nhật lương theo loại mới
3. Có thể chỉnh sửa thủ công
4. Submit → Cập nhật database

## 6. Lưu ý quan trọng

1. **Tự động hóa**: Luôn thiết lập giá trị mặc định khi thay đổi loại nhân viên
2. **Ghi đè**: Có thể chỉnh sửa thủ công sau khi tự động điền
3. **Thực tập sinh**: Lương cơ bản luôn = 0, chỉ có trợ cấp thực tập
4. **Consistency**: Đảm bảo tính nhất quán giữa loại nhân viên và lương
5. **UX tốt**: Giảm thiểu thao tác nhập liệu thủ công

## 7. Ví dụ sử dụng

### **Chuyển từ Official sang Contract:**

```
Trước: 15M lương + 500k phụ cấp + 1M thưởng
Sau: 12M lương + 300k phụ cấp + 500k thưởng
```

### **Chuyển từ Contract sang Intern:**

```
Trước: 12M lương + 300k phụ cấp + 500k thưởng
Sau: 0 lương + 3M trợ cấp + 200k thưởng
```

### **Chuyển từ Intern sang Official:**

```
Trước: 0 lương + 3M trợ cấp + 200k thưởng
Sau: 15M lương + 500k phụ cấp + 1M thưởng
```

Hệ thống này đảm bảo rằng mỗi loại nhân viên luôn có mức lương phù hợp và nhất quán, đồng thời giúp người dùng tiết kiệm thời gian khi tạo và cập nhật thông tin nhân viên.

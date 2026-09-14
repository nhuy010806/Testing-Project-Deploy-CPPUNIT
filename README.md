# CPPUNIT - Software Testing Project

An advanced, high-fidelity web-based test runner designed for students at the **University of Economics and Law (UEL)**  to perform automated black-box testing. This application supports running a set of 8 pre-defined academic testing scenarios, importing custom testing sheets, mapping parameters dynamically, analyzing success rates, exporting execution reports, and caching history locally.

👉 **Live Demo Website:** [https://cppunit-c8d48.web.app](https://cppunit-c8d48.web.app)

---

## 🌟 Key Features (Các Tính Năng Nổi Bật)

*   **UEL Academic Branding Header:** Styled with the official UEL university colors, squircle logo, and full-width corporate identity layout.
*   **8 Pre-programmed Scenarios (8 Kịch bản kiểm thử mẫu):**
    *   `FUNC01 - primeCheck`: Prime number validation within `[0, 1000]`.
    *   `FUNC02 - IsLeapYear`: Leap year check for years `≥ 1582`.
    *   `FUNC03 - BinToDec`: Converts dynamic binary strings to decimal digits.
    *   `FUNC04 - Triangle`: Classifies equilateral, isosceles, scalene, or invalid triangles.
    *   `FUNC05 - HuyChuoi`: Character string deletion based on custom positions.
    *   `FUNC06 - ThayThe`: String replacement tool.
    *   `FUNC07 - TinhTienDien`: Progressive electricity cost estimator with 10% VAT.
    *   `FUNC08 - SolveQuadratic`: Delta-based quadratic equation roots analysis.
*   **Custom JavaScript Sandbox:** Write custom runner scripts on-the-fly to test custom functions.
*   **Dynamic Sheet Parser (Trình đọc bảng tính thông minh):** Import Excel (`.xlsx`, `.xls`) or `.csv` files. The system automatically reads headers and maps ID, expected values, and input parameters.
*   **Local Run History (Lịch sử trình duyệt):** Utilizes client-side `localStorage` to save the last 10 execution summaries (File name, preset, time, pass rate) permanently without requiring a MongoDB database.
*   **Excel Results Export (Xuất báo cáo Excel):** Allows downloading a complete execution report containing IDs, dynamic inputs, expected results, actual outputs, status (PASS/FAIL), exceptions, and execution duration.

---

## 🛠 Tech Stack (Công Nghệ Sử Dụng)

*   **Frontend Framework:** Angular (v19 Standalone Components)
*   **Language:** TypeScript
*   **Style Sheet:** Vanilla CSS with custom glassmorphism components
*   **Libraries:**
    *   `xlsx` (SheetJS) - Client-side Excel reading & writing
    *   `bootstrap-icons` - Modern iconography system
*   **Hosting:** Firebase Hosting (CDN-accelerated SSL production URL)

---

## 🚀 How to Run Locally (Hướng Dẫn Chạy Dưới Local)

Follow these steps to set up and run the project locally on your machine:

### 1. Prerequisites (Yêu cầu hệ thống)
*   Node.js (version 18 or higher recommended)
*   npm (installed automatically with Node.js)

### 2. Installation (Cài đặt dependencies)
Open your terminal inside the project directory and run:
```bash
npm install

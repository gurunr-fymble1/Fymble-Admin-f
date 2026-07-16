# Fittbot Admin - Unit Economics Formulas (Simplified)

A simple cheatsheet explaining how the metrics on the Unit Economics page are calculated.

---

## 1. Customer Acquisition Cost (CAC)

### 📌 Simple Formula
```
CAC = Total Expenses / Total Paying Users
```

### ⚙️ Rules & Details:
1. **Total Expenses**: Sum of all expenses under the `"marketing"` category recorded within the selected date range.
2. **Total Paying Users**: Unique customers with successful payments in the selected date range.
   - **Excludes**: Test gyms (`gym_id = "1"`) and internal test/staff contact numbers.
3. **Fallback**: If paying users count is `0`, then CAC is automatically shown as `0`.

---

## 2. Cohort Retention

### 📌 Simple Formula
```
Cohort Retention = (Retained Paying Users / Base Paying Users) * 100
```

### ⚙️ Rules & Details:
This metric uses calendar months and focuses strictly on **Paying Users** (does **not** change with the date filters). To keep the metrics static throughout each current calendar month **Month M**, it compares the two previous fully completed months:
* **Base Starting Month (M-2)**: The month before the previous completed calendar month (must start on or after February 2026).
* **Comparison Month (M-1)**: The previous completed calendar month.
* **Base Paying Users**: The set of unique customers who had successful captured payments during **Month M-2**.
* **Retained Paying Users**: The set of unique customers who had successful captured payments in **both Month M-2 and Month M-1** (intersection).
* **Base Month Guard**: If **Month M-2** starts prior to February 2026 (e.g., if the current month is March 2026, making M-2 January 2026), the calculation is skipped (returns `"No data"`).

---

## 3. User Churn Rate

### 📌 Simple Formula
```
User Churn Rate = 100% - Cohort Retention
```

### ⚙️ Rules & Details:
- The percentage of paying users from the base completed month (`M-2`) who **failed to make any payment** in the subsequent completed month (`M-1`).
- Shows `"No data"` if Cohort Retention is skipped (for months before the February 2026 base start).

---

## 4. Lifetime Value (LTV)

### 📌 Simple Formula
```
LTV = ((ARPPU_last_month / Months) * Gross Margin %_last_month) / Churn Rate
```

### ⚙️ Rules & Details:
- **Value Unit**: **Currency (Rupees)** - measures the expected monetary lifetime value of a paying user.
- **Static Metric**: Bypasses active page-level filters; always calculated using the last completed month's ($M-1$) data.
- **ARPPU / Month**: Calculated as last completed month's `ARPPU` divided by `Months`.
- **Months Calculation**: Calculated as the number of calendar months between the **earliest payment month** in the database and the **previous completed month (M-1)** inclusive.
- **Fractions**: Both `Gross Margin %` (e.g., 85%) and `Churn Rate` (e.g., 5%) are converted to decimal fractions (divided by 100) for the calculation.
- **Capping**: If Churn Rate is `0%` (meaning 100% paying user retention), LTV uses a capped lifetime of **`24.00 months`**, resulting in:
  `LTV = (ARPPU_last_month / Months) * Gross Margin %_last_month * 24.00`.
- Shows `"No data"` if Cohort Retention is skipped.

---

## 5. LTV / CAC Ratio

### 📌 Simple Formula
```
LTV / CAC Ratio = LTV (Static) / CAC (Last Month)
```

### ⚙️ Rules & Details:
- **Static Metric**: Bypasses active page-level filters; always compares static LTV with the previous completed month's ($M-1$) CAC.
- **CAC (Last Month)**: Calculated as previous completed month's `"Marketing Expenses"` / previous completed month's `"Total Paying Users"`.
- Formatted to 4 decimal places on the page (e.g., `3.1416`).
- Shows `"No data"` if `CAC (Last Month)` is 0 or static LTV is unavailable.

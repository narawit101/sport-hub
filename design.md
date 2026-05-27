# Sport Hub - Refactored UI Design System & Guidelines

This document outlines the modernized, premium visual styles, CSS tokens, and component guidelines implemented during the May 2026 UI/UX refactoring. Use these patterns for any new forms, dashboards, and authentication pages to maintain design consistency.

---

## 1. Design Tokens & Color Palette

We transitioned from generic blocky colors and outline borders to harmonized, low-contrast palettes with deep navy brand colors:

| Token Name        | Value                                                                    | Purpose                                            |
| :---------------- | :----------------------------------------------------------------------- | :------------------------------------------------- |
| `--text-color`    | `#03045e`                                                                | Primary brand color, headers, primary buttons      |
| `--primary-bg`    | `#ffffff`                                                                | Page content backgrounds, card backgrounds         |
| `--secondary-bg`  | `#f8f9fa`                                                                | Card section fills, user details badges            |
| `--border-color`  | `#e9ecef`                                                                | Softer borders separating grids and content        |
| `--success-color` | `#28a745`                                                                | Valid states, submit success actions               |
| `--hover-success` | `#177c2e`                                                                | Submit success hover state                         |
| `--danger-color`  | `#dc3545`                                                                | Cancel buttons, clear filters, warning text        |
| `--overlay-bg`    | `rgba(75, 75, 75, 0.496)`                                                | Modal overlay backdrop, gray opacity               |
| `--lightbox-bg`   | `rgba(148, 163, 184, 0.7)`                                               | Lightbox overlay backdrop, semi-transparent gray   |
| `--border-radius` | `16px`                                                                   | Main container cards                               |
| `--input-radius`  | `8px`                                                                    | Form fields, select pickers, action buttons        |
| `--pill-radius`   | `30px`                                                                   | Role pills, status badges, verification indicators |
| `--shadow`        | `0 10px 30px -10px rgba(3, 4, 94, 0.08), 0 1px 3px rgba(3, 4, 94, 0.02)` | Smooth, modern drop shadows                        |

---

## 2. Card Containers & Headers

Every form and secure authentication layout uses a standard centered card layout with a soft shadow and rounded corners:

### Container CSS Pattern

```css
.card-container {
  max-width: 500px;
  width: 90%;
  margin: 120px auto 60px;
  padding: 35px;
  background: #ffffff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  box-sizing: border-box;
}
```

### Card Header Pattern (HTML/JSX)

Includes a circular background containing a clean vector SVG icon representing the action:

```jsx
<div className="card-header">
  <div className="header-icon-wrapper">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </div>
  <h2 className="card-title">หัวข้อหลัก</h2>
  <p className="card-subtitle">คำอธิบายสั้นๆ เกี่ยวกับฟังก์ชันหน้านี้</p>
</div>
```

---

## 3. Form Input Elements & Focus States

Inputs utilize a light gray background that animates to high contrast on focus, accompanied by a bold navy blue ring:

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: var(--input-radius);
  font-size: 15px;
  color: #212529;
  transition: all 0.2s ease;
  background-color: #fafafa;
  width: 100%;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--text-color);
  box-shadow: 0 0 0 3px rgba(3, 4, 94, 0.12);
  background-color: #ffffff;
}
```

---

## 4. Interactive Eye SVG Password Toggles

Replaced raw text links ("แสดง / ซ่อน") with absolute-positioned inline SVG buttons that change status on click:

```jsx
const [showPassword, setShowPassword] = useState(false);

// JSX:
<div className="password-wrapper">
  <input type={showPassword ? "text" : "password"} placeholder="กรอกรหัสผ่าน" />
  <button
    type="button"
    className="toggle-password-btn"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? (
      /* Eye Off SVG */
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      /* Eye SVG */
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
</div>;
```

---

## 5. Security Checklist Alerts

For forms enforcing complex validation (like Password Change / Password Reset pages), we use a structured helper checklist:

```jsx
<div className="password-requirements-box">
  <p className="requirements-title">ข้อกำหนดการตั้งรหัสผ่านใหม่:</p>
  <ul className="requirements-list">
    <li>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>ความยาวอย่างน้อย 10 ตัวอักษร</span>
    </li>
    <li>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>ประกอบด้วยตัวอักษรพิมพ์ใหญ่ (A-Z) และพิมพ์เล็ก (a-z)</span>
    </li>
  </ul>
</div>
```

---

## 6. Action Button Styles & Animations

Use pill or soft-rounded blocks that scale and glow on hover:

```css
.primary-btn {
  background: var(--text-color);
  color: #ffffff;
  border: none;
  padding: 13px 28px;
  border-radius: var(--input-radius);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(3, 4, 94, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn:hover:not(:disabled) {
  background: #020438;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(3, 4, 94, 0.22);
}

.primary-btn:disabled {
  background: #6c757d;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
```

### Loading State (Dot Loading)

Instead of boring text updates, buttons show three pulsing dots:

```css
.dot-loading {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dot-loading .dot {
  font-size: 10px;
  animation: pulse 1.4s infinite both;
  color: currentColor;
}

.dot-loading .dot.one {
  animation-delay: 0s;
}
.dot-loading .dot.two {
  animation-delay: 0.2s;
}
.dot-loading .dot.three {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}
```

---

## 7. Two-Column Dashboard Layout Pattern

For user profile settings, statistics summary lists, and dashboards, we split visual widgets and interactive forms:

```css
.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
  align-items: start;
}

@media screen and (max-width: 992px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
```

- **Left Column**: Compact circular avatar (150px x 150px) with camera hover overlay, role badges (`.badge-role`), account validation badges (`.badge-status.approved`), and metadata dates.
- **Right Column**: Flex-column container holding name edit form card (`.profile-form`), password link buttons, and account details cards (`.account-details-section`) styled in a side-by-side `.details-grid`.

---

## 8. Empty State Card Pattern

For lists or grids that can be empty (such as booking records, search results, or statistical records), replace raw text messages (like `ไม่พบคำสั่งจอง`) with a modern centered card widget.

### Guidelines

1. **Friendly Copywriting**:
   - Avoid plain, abrupt system errors or generic messages.
   - Tailor the title and subtext to the user's active role:
     - **Customers**: `"ไม่พบรายการจองของคุณ"` with a helpful subtext suggesting they start exploring venues, plus a primary action button pointing to the homepage (`ค้นหาสนามกีฬา`).
     - **Field Owners**: `"ไม่พบรายการจองสนาม"` or `"ไม่พบข้อมูลการจอง"` with instructions explaining active filters or encouraging them to clear filters.
2. **Visual Clues**:
   - Wrap an illustrative SVG icon in a circular background with 5% opacity.
   - Scale and slightly rotate the icon wrapper on hover as a micro-animation.
3. **Clean Layout**:
   - Use soft shadow, border radius, and flexbox centering.

### JSX Structure Example

```jsx
<div className="empty-booking-container">
  <div className="empty-booking-icon-wrapper">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  </div>
  <h3 className="empty-booking-title">ไม่พบรายการจองของคุณ</h3>
  <p className="empty-booking-description">
    คุณยังไม่มีประวัติการจองในระบบ
    เริ่มต้นจองสนามเพื่อสนุกกับการออกกำลังกายได้เลย!
  </p>
  <button
    type="button"
    className="empty-booking-action-btn"
    onClick={onActionClick}
  >
    <span>ค้นหาสนามกีฬา</span>
  </button>
</div>
```

### CSS Styling Rules

```css
.empty-booking-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 40px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: var(--shadow);
  max-width: 600px;
  margin: 30px auto;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.empty-booking-container:hover {
  transform: translateY(-2px);
  box-shadow:
    0 15px 35px -10px rgba(3, 4, 94, 0.1),
    0 2px 5px rgba(3, 4, 94, 0.02);
}

.empty-booking-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(3, 4, 94, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: var(--text-color, #03045e);
  transition:
    transform 0.3s ease,
    background 0.3s ease;
}

.empty-booking-container:hover .empty-booking-icon-wrapper {
  transform: scale(1.08) rotate(5deg);
  background: rgba(3, 4, 94, 0.08);
}
```

---

## 9. Modal Overlay & Transition Pattern

Modals and lightboxes should appear with smooth, lightweight CSS keyframe transition animations to feel premium and interactive.

### Guidelines

1. **Background Overlay**: Use `--overlay-bg` (`rgba(75, 75, 75, 0.496)`) with a blur filter (`backdrop-filter: blur(4px)`) to keep focus on the modal content.
2. **Mount Transitions**: Trigger a simple fade-in overlay and scale slide-in animation on modal content mounting.
3. **No Heavy Accents**: Do not use hard blue bar indicators (such as vertical lines) next to section titles; keep headers clean and typography-focused.

### CSS Animation Pattern

```css
@keyframes fadeInOverlay {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInContent {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-overlay {
  background-color: var(--overlay-bg);
  backdrop-filter: blur(4px);
  animation: fadeInOverlay 0.2s ease-out forwards;
}

.modal-content {
  animation: slideInContent 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

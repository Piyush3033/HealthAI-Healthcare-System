# HealthAI UI Implementation Guide

## V-Grid Data Grid Integration & Light/Dark Theme

This document outlines the modern UI implementation using the V-Grid data grid template with comprehensive light/dark mode support.

---

## Theme System

### ThemeContext
- **Location:** `frontend/src/context/ThemeContext.jsx`
- **Features:**
  - Automatic system preference detection
  - localStorage persistence
  - Global HTML class toggle (dark/light)
  - useTheme hook for component access

### Theme Toggle Component
- **Location:** `frontend/src/components/Common/ThemeToggle.jsx`
- **Features:**
  - Sun/Moon icons from lucide-react
  - Smooth transitions
  - Accessible button with aria-label

### Global Styles
- **Location:** `frontend/src/index.css`
- **Enhancements:**
  - CSS transitions for smooth theme switching
  - Custom scrollbar styling (light/dark variants)
  - Color scheme metadata for browser integration

---

## V-Grid Data Grid Component

### DataGrid Component
- **Location:** `frontend/src/components/DataGrid/DataGrid.jsx`
- **Technology:** TanStack Table v8 + React Virtual
- **Features:**
  - Virtual scrolling for 100,000+ rows
  - Sorting with visual indicators (up/down chevrons)
  - Global search functionality
  - Pagination controls
  - Server-side ready architecture
  - Complete light/dark theme support

### Column Definition
```jsx
const columns = [
  {
    accessorKey: 'field_name',
    header: 'Display Name',
    cell: (info) => <CustomComponent value={info.getValue()} />
  }
]
```

### Usage
```jsx
<DataGrid
  columns={columns}
  data={patients}
  enableSearch={true}
  enableVirtualization={true}
  pageSize={20}
  onRowClick={handleRowClick}
/>
```

---

## Navigation Component

### Features
- **Location:** `frontend/src/components/Common/Navigation.jsx`
- Theme toggle integrated in navbar
- Role-based menu items (Platform 1 vs Platform 2)
- Mobile responsive with hamburger menu
- Active link highlighting
- User info display
- Logout functionality

### Theme-Aware Colors
- Light mode: White background with gray accents
- Dark mode: Gray-900 background with appropriate text colors
- Smooth transitions on all elements

---

## Platform 1 - Healthcare Providers

### PatientsList Component
- **V-Grid Integration:** Full DataGrid with sorting, filtering, search
- **Columns:**
  - Patient ID
  - Name (sortable)
  - Phone
  - Blood Group
  - Status (badge styling)
  - Action (View link)
- **Theme Support:** Complete light/dark styling
- **Performance:** Virtual scrolling for large datasets

### Referrals Component
- **Tab-Based UI:** Incoming/Outgoing referrals
- **Features:**
  - Status icons (accepted/pending/rejected)
  - Quick action buttons for pending referrals
  - Responsive card layout
  - Theme-aware colors and borders

---

## Platform 2 - Patient Portal

### Integrated Components
- PatientDashboard
- MedicalRecords
- HealthInsights

All components use the same theme system and modern styling patterns.

---

## Color Palette

### Light Mode
- Background: #f9fafb (gray-50)
- Card: #ffffff (white)
- Text: #111827 (gray-900)
- Borders: #e5e7eb (gray-200)
- Primary: #2563eb (blue-600)

### Dark Mode
- Background: #0f172a (slate-950)
- Card: #1f2937 (gray-800)
- Text: #f1f5f9 (slate-100)
- Borders: #374151 (gray-700)
- Primary: #60a5fa (blue-400)

---

## Component Styling Patterns

### Theme-Aware Classes
```jsx
const bgClass = isDark ? 'bg-gray-900' : 'bg-white';
const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
```

### Transitions
- All theme changes include smooth CSS transitions (0.3s ease)
- No jarring color shifts or flashing

---

## Accessibility Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Arrow keys)
- High contrast ratios in both themes
- Focus indicators on buttons and links
- Screen reader support

---

## Performance Optimizations

### Virtual Scrolling
- Handles 100,000+ rows efficiently
- Only renders visible rows + buffer
- Smooth scrolling experience

### Memoization
- Column definitions memoized with useMemo
- Prevents unnecessary re-renders

### Lazy Loading
- Data loaded on-demand
- Pagination support for large datasets

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install @tanstack/react-table @tanstack/react-virtual lucide-react
   ```

2. **Theme Setup**
   - Wrap App with `<ThemeProvider>`
   - All components automatically inherit theme

3. **DataGrid Usage**
   - Import DataGrid component
   - Define columns with accessorKey
   - Pass data and config props

---

## Future Enhancements

- Advanced filtering UI
- Column visibility toggler
- Custom cell renderers library
- Export to CSV/Excel
- Row selection with bulk actions
- Resizable columns
- Column pinning (freeze columns)
- Server-side pagination integration

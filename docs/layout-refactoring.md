# Layout Refactoring Guide

This document outlines how to refactor the UI layout from a top navigation bar to a fixed left sidebar with improved content layout.

## Components Created

### 1. Sidebar Component (`src/components/Sidebar.tsx`)

A new sidebar component that replaces the top navigation bar. Features:

- Fixed position on the left side of the screen
- Displays navigation links with appropriate icons
- Shows active state for the current page
- Includes user profile and logout options at the bottom
- Responsive design with appropriate styling

### 2. DashboardLayout Component (`src/components/DashboardLayout.tsx`)

A layout component specifically for dashboard pages that:

- Organizes content in a more space-efficient horizontal layout
- Reduces vertical scrolling by utilizing horizontal space better
- Groups related content in a logical manner
- Maintains the visual style of the original design
- Uses a responsive grid layout for different screen sizes

## Implementation Steps

### 1. Update the Root Layout (`src/app/layout.tsx`)

The root layout has been modified to:

- Replace `<Navbar />` with `<Sidebar />`
- Add left margin to the main content area to accommodate the sidebar width
- Update the footer to also have the same left margin

```tsx
<Sidebar />
<main id="main-content" tabIndex={-1} className="ml-64 flex-grow bg-gray-50 min-h-screen p-6">
  {children}
</main>
<Footer className="ml-64" />
```

### 2. Using the DashboardLayout Component

The dashboard page can be updated to use the new layout component:

```tsx
return (
  <DashboardLayout
    welcomeSection={<WelcomeSection />}
    systemOverview={[
      <PersonnelOverview key="personnel" />,
      <DocumentsOverview key="documents" />,
      <TrainingsOverview key="trainings" />
    ]}
    quickActions={[
      <TotalPersonnelAction key="total-personnel" />,
      <ActivePersonnelAction key="active-personnel" />,
      <PendingDocumentsAction key="pending-documents" />
    ]}
    managementSections={[
      <PersonnelManagement key="personnel-management" />,
      <DocumentVerification key="document-verification" />
    ]}
  />
);
```

## Layout Structure

1. **Sidebar** - Fixed on the left side of the screen
2. **Main Content** - Organized in a logical flow with horizontal layout:
   - Welcome section at the top
   - System Overview cards in a 3-column grid
   - Quick Actions in a 3-column grid
   - Management Sections in a 2-column grid

## Tailwind CSS Classes Used

### Sidebar
- `fixed top-0 left-0 h-screen w-64 bg-black shadow-lg flex flex-col z-10`: Core sidebar styling
- `flex items-center`, `space-y-1`, `gap-x-3`: Flexbox utilities for alignment
- `bg-gray-900 text-[#FFBF00]`: Active state styling
- `text-gray-300 hover:bg-gray-800 hover:text-white`: Hover effects

### Main Content Layout
- `ml-64`: Left margin to accommodate sidebar width
- `grid grid-cols-1 md:grid-cols-3 gap-4`: Responsive grid for cards
- `grid grid-cols-1 md:grid-cols-2 gap-6`: Two-column layout for management sections
- `space-y-6`: Vertical spacing between sections

## Responsive Behavior

- The sidebar remains visible on desktop screens
- On smaller screens, you may want to implement a toggle mechanism to show/hide the sidebar
- Grid layouts adjust from multiple columns to single column on small screens using responsive classes (`md:grid-cols-3` to `grid-cols-1`)

## Advantages of the New Layout

1. **Better Screen Utilization**: Horizontal layout reduces vertical scrolling
2. **Improved Navigation**: Sidebar provides constant access to navigation options
3. **Clearer Content Organization**: Related items are grouped together visually
4. **Consistent Design Language**: Maintains the existing color scheme and design elements
5. **Enhanced Usability**: Important information is visible at a glance

## Icons Used

The implementation uses HeroIcons from the `@heroicons/react/24/outline` package:
- Dashboard: `HomeIcon`
- Documents: `DocumentTextIcon`
- Trainings: `AcademicCapIcon`
- Personnel: `UserGroupIcon`
- Analytics: `ChartBarIcon`
- Settings/Admin: `Cog6ToothIcon`
- Profile: `UserCircleIcon`
- Logout: `ArrowRightOnRectangleIcon` 
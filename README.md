# HR Frontend

Web application for the HR management system. It provides intuitive dashboards for HR/Admins and Employees, enabling management of employee data, attendance, leave requests, overtime, and payroll.

<!-- Add your actual screenshot -->
![Demo Screenshot](assets/hrms.gif)

## Features

### HR/Admin Module
- Dashboard with overall statistics
- Employee management (add, update, remove employees)
- Department management
- Attendance tracking (daily, weekly, monthly views)
- Shift and off-day scheduling
- Leave request approval/management
- Overtime request approval/management
- Payroll calculation and management

### Employee Module
- Personalized employee dashboard
- Profile management
- Attendance calendar (view daily IN/OUT records)
- Submit leave and overtime requests
- Payslip history

## Tech Stack

- **JavaScript** (React + Vite)
- **HTML / CSS**
- **RESTful API** integration (connects to backend services)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oopsyvivi/hr-frontend.git
   cd hr-frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Usage

- **Admin/HR Login:**  
  - Register or log in as an admin to access your dashboard and manage employees.
  - Admins can add new employees.
- **Employee Accounts:**  
  - Employees do not self-register. When an admin adds a new employee, the system automatically generates an employee account with a default   password (Employee Code).
- **Feature Workflow:**
  - Admin/HR can:
    - manage requests, review attendance, and handle leave and overtime approvals.
  - Employees can:
    - Track their own daily IN/OUT attendance data.
    - Apply for Forgot Card (missed punch), leave, and overtime requests.
    - View payslip and attendance history.

## Project Structure

```
src/
  components/   # UI components
  pages/        # Application pages
  services/     # API calls
  assets/       # Images and static files
```

## Questions

For any questions or suggestions, feel free to [open an issue](https://github.com/oopsyvivi/hr-frontend/issues) or contact [oopsyvivi](https://github.com/oopsyvivi).
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const path = window.location.pathname

  // All these paths show the Dashboard
  if (path === '/dashboard' ||
      path === '/employee/dashboard' ||
      path.startsWith('/dashboard') ||
      path.startsWith('/employee')) {
    
    // Check if logged in
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
      return null
    }
    return <Dashboard />
  }

  // Default — show login
  return <Login />
}

export default App
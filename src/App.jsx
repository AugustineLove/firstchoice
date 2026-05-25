import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/public/HomePage'
import TeamPage from './pages/public/TeamPage'
import { ThemeProvider } from './context/ThemeContext'


export default function App() {
  return (
   <ThemeProvider >
       <Routes>
      <Route path="/" element={<HomePage />} />
       <Route path="/team" element={<TeamPage />} />
      {/* <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/:tab" element={<AdminPage />} /> */}
    </Routes>
   </ThemeProvider>
  )
}
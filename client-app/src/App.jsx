import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConnectionProvider } from './context/ConnectionContext'
import ClientConnectionPage from './components/ClientConnectionPage'
import CustomerLogin from './components/CustomerLogin'

const App = () => {
  return (
    <ConnectionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ClientConnectionPage />} />
          <Route path="/login" element={<CustomerLogin />} />
        </Routes>
      </Router>
    </ConnectionProvider>
  )
}

export default App
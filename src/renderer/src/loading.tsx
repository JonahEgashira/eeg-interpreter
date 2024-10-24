import React from 'react'
import ReactDOM from 'react-dom/client'
import LoadingScreen from './components/LoadingScreen'
import './assets/main.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('loading-root')!).render(
  <React.StrictMode>
    <LoadingScreen />
  </React.StrictMode>
)

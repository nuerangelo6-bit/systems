import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App.jsx'
import './styles/global.css'
import { getTheme, applyTheme } from './utils/theme.js'
import { setupAxiosAuth } from './utils/auth.js'


applyTheme(getTheme())


setupAxiosAuth(axios)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

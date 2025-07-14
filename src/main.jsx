import { createRoot } from 'react-dom/client'
import React from 'react';
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ShopContextProvider>
    <SocketProvider>
    <App />    
    </SocketProvider>
    </ShopContextProvider>
  </BrowserRouter>
)

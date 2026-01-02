import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "mathlive";
import "mathlive/fonts.css";
import './i18n';
import './index.css' // 없으면 './style.css'로 바꿔도 됨

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

console.log("[前端] main.tsx 加载中...");

// 本地配置会在 persist 中间件恢复后自动加载
// 详见 stores/configStore.ts 中的 onRehydrateStorage 回调
const rootElement = document.getElementById("root");
console.log("[前端] root 元素:", rootElement);

if (rootElement) {
  console.log("[前端] 开始渲染 React 应用...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log("[前端] React 渲染完成");
} else {
  console.error("[前端] 错误: 找不到 root 元素!");
}

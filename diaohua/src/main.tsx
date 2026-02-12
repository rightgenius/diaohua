import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
import { useConfigStore } from "./stores/configStore";

console.log("[前端] main.tsx 加载中...");

// 确保加载本地配置文件
const loadConfig = async () => {
  console.log("[前端] 开始加载本地配置...");
  try {
    await useConfigStore.getState().loadLocalConfig();
    console.log("[前端] 本地配置加载调用完成");
  } catch (e) {
    console.error("[前端] 加载本地配置失败:", e);
  }
};

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
  
  // 延迟加载配置（确保 store 已初始化）
  setTimeout(loadConfig, 100);
} else {
  console.error("[前端] 错误: 找不到 root 元素!");
}

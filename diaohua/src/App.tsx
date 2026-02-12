import { Routes, Route, useLocation, Outlet } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { RequirementEditor } from "./pages/RequirementEditor";
import { Settings } from "./pages/Settings";
import { Share } from "./pages/Share";

console.log("[前端] App.tsx 加载中...");

// 布局包装器
function LayoutWrapper() {
  console.log("[前端] LayoutWrapper 渲染");
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function App() {
  const location = useLocation();
  console.log("[前端] App 渲染, 当前路径:", location.pathname);

  return (
    <Routes>
      {/* 分享页面 - 无布局 */}
      <Route path="/share/:id" element={<Share />} />
      
      {/* 主布局路由 */}
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requirement/:id?" element={<RequirementEditor />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;

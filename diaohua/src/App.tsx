import { Routes, Route, useLocation } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { RequirementEditor } from "./pages/RequirementEditor";
import { Settings } from "./pages/Settings";
import { Share } from "./pages/Share";

function App() {
  const location = useLocation();
  const isSharePage = location.pathname.startsWith('/share/');

  // 分享页面不使用 MainLayout
  if (isSharePage) {
    return (
      <Routes>
        <Route path="/share/:id" element={<Share />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requirement/:id?" element={<RequirementEditor />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  );
}

export default App;

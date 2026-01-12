import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Registrar from "./pages/Registrar";
import Tarefas from "./pages/Tarefas";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/tarefas" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/tarefas" element={<Tarefas />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

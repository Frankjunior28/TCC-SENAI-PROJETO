import { Navigate, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ papel }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (papel && usuario.papel !== papel) {
    return <Navigate to={`/${usuario.papel}`} replace />;
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  papel: PropTypes.string,
};

export default ProtectedRoute;

import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Top navigation and shared page frame.
export function Layout() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <Link className="brand" to="/">
          Blue Sky <span>Hotel</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/">Rooms</NavLink>
          {isLoggedIn && !isAdmin && <NavLink to="/bookmarks">Saved</NavLink>}
          {isLoggedIn && !isAdmin && <NavLink to="/book">Book a Room</NavLink>}
          {isLoggedIn && !isAdmin && <NavLink to="/bookings">My Bookings</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          {!isLoggedIn && <NavLink to="/login">Login</NavLink>}
          {!isLoggedIn && <NavLink to="/register">Register</NavLink>}
          {isLoggedIn && !isAdmin && (
            <span className="nav-user">{user.name}</span>
          )}
          {isLoggedIn && (
            <button type="button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

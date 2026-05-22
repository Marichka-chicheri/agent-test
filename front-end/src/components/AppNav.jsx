import { Link, useLocation } from "react-router-dom"

const links = [
  { to: "/live", label: "Live" },
  { to: "/constructor", label: "Create" },
  { to: "/settings", label: "API Keys" },
]

export function AppNav() {
  const { pathname } = useLocation()

  return (
    <nav style={styles.nav}>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            ...styles.link,
            ...(pathname === to ? styles.linkActive : {}),
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

const styles = {
  nav: {
    display: "flex",
    gap: 6,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 4,
  },
  link: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
  },
  linkActive: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
}

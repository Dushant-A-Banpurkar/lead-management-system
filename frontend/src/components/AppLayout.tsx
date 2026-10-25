import { BarChart3, ChevronDown, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {menuOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={closeMenu} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform md:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3" onClick={closeMenu}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><BarChart3 size={22} /></span>
            <span className="text-lg font-bold tracking-tight text-slate-900">leadflow</span>
          </NavLink>
          <button className="icon-button md:hidden" aria-label="Close menu" onClick={closeMenu}><X size={19} /></button>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1">
          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}><LayoutDashboard size={18} /> Overview</NavLink>
          <NavLink to="/leads" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}><Users size={18} /> Leads</NavLink>
        </nav>
        <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-indigo-700">{user?.name.charAt(0).toUpperCase()}</div>
          <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <p className="mb-4 mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">{user?.role}</p>
          <button onClick={signOut} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-rose-600"><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
          <button aria-label="Open menu" className="icon-button md:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="hidden text-sm text-slate-500 md:block">Your sales workspace, at a glance</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{user?.name.charAt(0).toUpperCase()}</span>
            <span className="hidden text-sm font-semibold text-slate-700 sm:block">{user?.name}</span>
            <ChevronDown className="hidden text-slate-400 sm:block" size={16} />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

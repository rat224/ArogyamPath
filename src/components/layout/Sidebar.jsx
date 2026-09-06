
import React from "react";
import logo from "../../assets/logo.png";

const Sidebar = ({ 
  navItems, 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  setIsMobileOpen,
  roleColor = "emerald"
}) => {
  const colorMap = {
    emerald: {
      active: "bg-emerald-600 text-white shadow-emerald-200",
      hover: "hover:bg-emerald-50 hover:text-emerald-600",
      lightBg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    blue: {
      active: "bg-blue-600 text-white shadow-blue-200",
      hover: "hover:bg-blue-50 hover:text-blue-600",
      lightBg: "bg-blue-50",
      border: "border-blue-100"
    }
  };

  const theme = colorMap[roleColor] || colorMap.emerald;

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/*  SIDEBAR MAIN */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-50 p-8 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className={`w-14 h-14 flex items-center justify-center p-1.5 bg-white rounded-full border-2 ${theme.border} hover:scale-105 transition-transform duration-500 overflow-hidden shrink-0`}>
            <img src={logo} alt="ArogyamPath Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            Arogyam<span className={roleColor === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}>Path</span>
          </span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 group
                ${activeTab === item.id
                  ? `${theme.active} shadow-lg scale-[1.02]`
                  : item.danger
                    ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                    : `text-gray-400 ${item.hoverColor ? colorMap[item.hoverColor].hover : theme.hover}`}
              `}
            >
              <span className={`
                ${item.special ? 'group-hover:rotate-180 transition-transform duration-700' : ''}
                ${item.danger ? 'group-hover:-translate-x-1 transition-transform' : ''}
              `}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>
    </>
  );
};

export default React.memo(Sidebar);

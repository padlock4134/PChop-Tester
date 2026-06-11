import React, { createContext, useContext, useState } from 'react';

const AdminToggleContext = createContext<{ isAdminMode: boolean; toggleAdminMode: () => void }>({
  isAdminMode: false,
  toggleAdminMode: () => {},
});

export const useAdminToggle = () => useContext(AdminToggleContext);

export const AdminToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  return (
    <AdminToggleContext.Provider value={{ isAdminMode, toggleAdminMode }}>
      {children}
    </AdminToggleContext.Provider>
  );
};

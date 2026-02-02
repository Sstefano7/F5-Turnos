import { createContext, useState, useContext } from 'react';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const triggerRefresh = () => {
    setRefreshDashboard(prev => prev + 1);
  };

  return (
    <DashboardContext.Provider value={{ refreshDashboard, triggerRefresh }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe ser usado dentro de DashboardProvider');
  }
  return context;
};

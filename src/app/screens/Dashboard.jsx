import React, { useContext, useEffect } from 'react';
import { DashboardContext } from '../App';

export default function Dashboard() {
  const { setIsDashboard } = useContext(DashboardContext);
  useEffect(() => {
    setIsDashboard(true);
    return () => {
      setIsDashboard(false);
    };
  }, []);

  return <>1</>;
}

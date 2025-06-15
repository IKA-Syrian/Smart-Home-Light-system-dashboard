
import { createContext, useContext, useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProviderContext = createContext({ theme: "light", toggleTheme: () => {} });

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};

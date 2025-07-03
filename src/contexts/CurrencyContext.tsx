import React, { createContext, useContext, useState, useEffect } from "react";

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate to USD
}

interface CurrencyContextType {
  currentCurrency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 460 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.85 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.73 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.25 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.35 },
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 15 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 110 },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", rate: 6 },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
}) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(
    currencies[0]!
  );

  // Load saved currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem("martRuns_currency");
    if (savedCurrency) {
      const currency = currencies.find((c) => c.code === savedCurrency);
      if (currency) {
        setCurrentCurrency(currency);
      }
    }
  }, []);

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem("martRuns_currency", currency.code);
  };

  const formatPrice = (amount: number) => {
    return `${currentCurrency.symbol}${amount.toFixed(2)}`;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currencies,
    setCurrency,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
 
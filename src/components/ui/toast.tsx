import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
}

export function Toast({ message, type = "success", duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-2 rounded-md shadow-lg text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
      role="alert"
    >
      {message}
    </div>
  );
}

// src/utils/debounce.js
import { useRef, useEffect } from "react";

export default function useDebounce(value, delay) {
  const handler = useRef(null);
  const [debouncedValue, setDebouncedValue] = require("react").useState(value);

  useEffect(() => {
    handler.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler.current);
  }, [value, delay]);

  return debouncedValue;
}

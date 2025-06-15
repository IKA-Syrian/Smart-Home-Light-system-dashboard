import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";

interface TimePickerInputProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePickerInput({
  value,
  onChange,
  className,
  id,
  disabled,
  placeholder,
  ...props
}: TimePickerInputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [timeString, setTimeString] = useState<string>("");

  // Initialize time string from value
  useEffect(() => {
    if (value) {
      setTimeString(format(value, "HH:mm"));
    }
  }, [value]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTimeString(newValue);
    
    // Try to parse the time string
    try {
      // Use today's date with the time from input
      const today = new Date();
      const dateString = format(today, "yyyy-MM-dd");
      const dateTimeString = `${dateString} ${newValue}`;
      const parsedDate = parse(dateTimeString, "yyyy-MM-dd HH:mm", new Date());
      
      if (!isNaN(parsedDate.getTime())) {
        onChange?.(parsedDate);
      }
    } catch (error) {
      // Invalid time format, do nothing
    }
  };

  return (
    <Input
      type="time"
      value={timeString}
      onChange={handleChange}
      className={cn("w-full", className)}
      id={id}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
} 
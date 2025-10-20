import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleInvalid = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLInputElement;

      if (target.validity.valueMissing) {
        target.setCustomValidity('請填寫此欄位');
      } else if (target.validity.typeMismatch) {
        if (target.type === 'email') {
          target.setCustomValidity('請輸入有效的電子郵件地址');
        } else if (target.type === 'url') {
          target.setCustomValidity('請輸入有效的網址');
        } else {
          target.setCustomValidity('請輸入有效的格式');
        }
      } else if (target.validity.patternMismatch) {
        target.setCustomValidity('請符合要求的格式');
      } else if (target.validity.tooShort) {
        target.setCustomValidity(`請至少輸入 ${target.minLength} 個字元`);
      } else if (target.validity.tooLong) {
        target.setCustomValidity(`請輸入不超過 ${target.maxLength} 個字元`);
      } else if (target.validity.rangeUnderflow) {
        target.setCustomValidity(`請輸入大於或等於 ${target.min} 的值`);
      } else if (target.validity.rangeOverflow) {
        target.setCustomValidity(`請輸入小於或等於 ${target.max} 的值`);
      } else if (target.validity.stepMismatch) {
        target.setCustomValidity('請輸入有效的值');
      } else {
        target.setCustomValidity('請檢查此欄位');
      }
    };

    const handleInput = () => {
      if (input) {
        input.setCustomValidity('');
      }
    };

    input.addEventListener('invalid', handleInvalid);
    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('invalid', handleInvalid);
      input.removeEventListener('input', handleInput);
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

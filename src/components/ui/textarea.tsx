import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInvalid = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;

      if (target.validity.valueMissing) {
        target.setCustomValidity('請填寫此欄位');
      } else if (target.validity.tooShort) {
        target.setCustomValidity(`請至少輸入 ${target.minLength} 個字元`);
      } else if (target.validity.tooLong) {
        target.setCustomValidity(`請輸入不超過 ${target.maxLength} 個字元`);
      } else {
        target.setCustomValidity('請檢查此欄位');
      }
    };

    const handleInput = () => {
      if (textarea) {
        textarea.setCustomValidity('');
      }
    };

    textarea.addEventListener('invalid', handleInvalid);
    textarea.addEventListener('input', handleInput);

    return () => {
      textarea.removeEventListener('invalid', handleInvalid);
      textarea.removeEventListener('input', handleInput);
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

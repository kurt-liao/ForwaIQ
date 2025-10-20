/**
 * 設置表單元素的中文驗證訊息
 */
export function setupFormValidation(formElement: HTMLFormElement | null) {
  if (!formElement) return;

  const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    // 當驗證失敗時顯示中文訊息
    element.addEventListener('invalid', (e) => {
      e.preventDefault();
      
      if (element.validity.valueMissing) {
        element.setCustomValidity('請填寫此欄位');
      } else if (element.validity.typeMismatch) {
        if ((element as HTMLInputElement).type === 'email') {
          element.setCustomValidity('請輸入有效的電子郵件地址');
        } else if ((element as HTMLInputElement).type === 'url') {
          element.setCustomValidity('請輸入有效的網址');
        } else {
          element.setCustomValidity('請輸入有效的格式');
        }
      } else if (element.validity.patternMismatch) {
        element.setCustomValidity('請符合要求的格式');
      } else if (element.validity.tooShort) {
        element.setCustomValidity(`請至少輸入 ${(element as HTMLInputElement).minLength} 個字元`);
      } else if (element.validity.tooLong) {
        element.setCustomValidity(`請輸入不超過 ${(element as HTMLInputElement).maxLength} 個字元`);
      } else if (element.validity.rangeUnderflow) {
        element.setCustomValidity(`請輸入大於或等於 ${(element as HTMLInputElement).min} 的值`);
      } else if (element.validity.rangeOverflow) {
        element.setCustomValidity(`請輸入小於或等於 ${(element as HTMLInputElement).max} 的值`);
      } else if (element.validity.stepMismatch) {
        element.setCustomValidity('請輸入有效的值');
      } else {
        element.setCustomValidity('請檢查此欄位');
      }
    });
    
    // 當用戶開始輸入時清除自定義訊息
    element.addEventListener('input', () => {
      element.setCustomValidity('');
    });
    
    // 當下拉選單改變時清除自定義訊息
    element.addEventListener('change', () => {
      element.setCustomValidity('');
    });
  });
}

/**
 * 為單個元素設置中文驗證訊息
 */
export function setupInputValidation(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  element.addEventListener('invalid', (e) => {
    e.preventDefault();
    
    if (element.validity.valueMissing) {
      element.setCustomValidity('請填寫此欄位');
    } else if (element.validity.typeMismatch) {
      if ((element as HTMLInputElement).type === 'email') {
        element.setCustomValidity('請輸入有效的電子郵件地址');
      } else if ((element as HTMLInputElement).type === 'url') {
        element.setCustomValidity('請輸入有效的網址');
      } else {
        element.setCustomValidity('請輸入有效的格式');
      }
    } else if (element.validity.patternMismatch) {
      element.setCustomValidity('請符合要求的格式');
    } else if (element.validity.tooShort) {
      element.setCustomValidity(`請至少輸入 ${(element as HTMLInputElement).minLength} 個字元`);
    } else if (element.validity.tooLong) {
      element.setCustomValidity(`請輸入不超過 ${(element as HTMLInputElement).maxLength} 個字元`);
    } else if (element.validity.rangeUnderflow) {
      element.setCustomValidity(`請輸入大於或等於 ${(element as HTMLInputElement).min} 的值`);
    } else if (element.validity.rangeOverflow) {
      element.setCustomValidity(`請輸入小於或等於 ${(element as HTMLInputElement).max} 的值`);
    } else if (element.validity.stepMismatch) {
      element.setCustomValidity('請輸入有效的值');
    } else {
      element.setCustomValidity('請檢查此欄位');
    }
  });
  
  element.addEventListener('input', () => {
    element.setCustomValidity('');
  });
  
  element.addEventListener('change', () => {
    element.setCustomValidity('');
  });
}


import { useRef } from 'react';

export const usePrint = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;

      // Create print styles
      const printStyles = `
        <style>
          @media print {
            * {
              visibility: hidden;
            }
            .print-template, .print-template * {
              visibility: visible;
            }
            .print-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
            }
          }
        </style>
      `;

      document.head.insertAdjacentHTML('beforeend', printStyles);
      document.body.innerHTML = printContent;
      
      window.print();
      
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  return { printRef, handlePrint };
};

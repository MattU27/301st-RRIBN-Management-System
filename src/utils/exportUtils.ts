/**
 * Export Utilities
 * 
 * This file contains utility functions for exporting data in various formats.
 */

// Use dynamic imports for packages
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

/**
 * Export data as CSV
 * @param data Array of objects to export
 * @param filename Filename for the exported file (without extension)
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => headers.map(key => {
      // Handle values that might contain commas by wrapping in quotes
      const cellValue = row[key] === null || row[key] === undefined ? '' : row[key];
      return typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"'))
        ? `"${cellValue.replace(/"/g, '""')}"` // Escape quotes within quoted fields
        : cellValue;
    }).join(','))
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Export data as Excel
 * @param data Array of objects to export
 * @param filename Filename for the exported file (without extension)
 */
export async function exportToExcel<T extends Record<string, any>>(data: T[], filename: string): Promise<void> {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  try {
    // Dynamically import xlsx
    const XLSX = await import('xlsx');
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV if Excel export fails
    alert('Excel export failed. Downloading as CSV instead.');
    exportToCSV(data, filename);
  }
}

/**
 * Export data as PDF
 * This is a simplified version that opens a new window with formatted data
 * In a real app, you would use a library like jspdf or pdfmake
 * @param data Array of objects to export
 * @param title Title for the PDF document
 * @param filename Filename for the exported file (without extension)
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[], 
  title: string, 
  filename: string
): void {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 30);
    
    // Add header text
    doc.setFontSize(12);
    doc.text('301st RRIBN INFANTRY BATTALION', 14, 38);
    doc.text('Philippine Army Reserve Command', 14, 44);
    
    // Add table
    const headers = Object.keys(data[0]).map(header => 
      formatHeader(header)
    );
    
    const rows = data.map(row => 
      Object.values(row).map(value => 
        formatValue(value)
      )
    );
    
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 99],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 245]
      },
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount} - Confidential Information - 301st RRIBN`, 14, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again later.');
    
    // Fallback to HTML version if needed
    createHtmlReport(data, title, filename);
  }
}

/**
 * Format a header string for display
 * Converts camelCase or snake_case to Title Case with spaces
 */
function formatHeader(header: string): string {
  return header
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim() // Remove leading/trailing whitespace
    .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
}

/**
 * Format a value for display in the PDF
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Function to format date in a more readable format
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Creates an HTML report that opens in a new tab
function createHtmlReport<T extends Record<string, any>>(
  data: T[], 
  title: string, 
  filename: string
): void {
  // Create new window for the PDF template
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report');
    return;
  }
  
  // Format current date
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);
  
  // Extract column headers and rows
  const headers = Object.keys(data[0]).map(header => 
    header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
  );
  
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    )
  );

  // Create HTML content for the new window
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 30px;
          color: #333;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
        }
        h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 24px;
        }
        .report-info {
          margin: 15px 0 30px 0;
          font-size: 14px;
        }
        .report-meta {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
        }
        .generated-date {
          font-style: italic;
          color: #666;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 13px;
        }
        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #555;
          text-transform: uppercase;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f1f1f1;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          text-align: center;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .print-button {
          background-color: #4f46e5;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 20px;
        }
        .print-button:hover {
          background-color: #4338ca;
        }
        @media print {
          .print-button {
            display: none;
          }
          body {
            margin: 0;
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <img src="/logos/logo-dark.png" alt="301st RRIBN Logo" class="logo" onerror="this.onerror=null; this.src='/favicon.ico';">
        <h1>301st RRIBN INFANTRY BATTALION</h1>
        <p>Philippine Army Reserve Command</p>
        <h2>${title}</h2>
      </div>

      <div class="report-meta">
        <div class="report-info">
          <strong>Total Records:</strong> ${data.length}<br>
        </div>
        <div class="generated-date">
          Generated on: ${formattedDate}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This is an official document of the 301st RRIBN Infantry Battalion.</p>
        <p>Confidential information - Do not distribute without permission.</p>
      </div>

      <div style="text-align: center;">
        <button class="print-button" onclick="window.print();">Print Report</button>
      </div>

      <script>
        // Auto-load images or fallback
        document.addEventListener('DOMContentLoaded', function() {
          const logoImg = document.querySelector('.logo');
          if (logoImg) {
            logoImg.onerror = function() {
              this.src = '/favicon.ico';
              this.onerror = function() {
                this.style.display = 'none';
              };
            };
          }
        });
      </script>
    </body>
    </html>
  `;

  // Write the HTML content to the new window
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

// Utility function to directly print data
export const printReport = (data: any[], title: string) => {
  if (!data || !data.length) {
    console.error('No data to print');
    return;
  }
  
  // Open the print template in a new window
  createHtmlReport(data, title, '');
}; 
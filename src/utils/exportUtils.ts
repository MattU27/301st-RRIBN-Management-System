/**
 * Export Utilities
 * 
 * This file contains utility functions for exporting data in various formats.
 */

/**
 * Export data as CSV
 * @param data Array of objects to export
 * @param filename Filename for the exported file (without extension)
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that need quotes (strings with commas, quotes, or newlines)
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value !== undefined && value !== null ? value : '';
      }).join(',')
    )
  ].join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as Excel (XLSX)
 * This is a simplified version that uses CSV as a fallback
 * In a real app, you would use a library like xlsx or exceljs
 * @param data Array of objects to export
 * @param filename Filename for the exported file (without extension)
 */
export function exportToExcel<T extends Record<string, any>>(data: T[], filename: string): void {
  // In a real app, you would use a library like xlsx or exceljs
  // For this demo, we'll just use CSV as a fallback
  exportToCSV(data, filename);
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
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create a new window for the PDF preview
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()">Print / Save as PDF</button>
        <button onclick="window.close()">Close</button>
      </div>
      
      <h1>${title}</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${formatHeader(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${formatValue(row[header])}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>AFP Personnel Management System - ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;
  
  // Write to the new window and trigger print dialog
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Format a header string for display
 * Converts camelCase or snake_case to Title Case with spaces
 */
function formatHeader(header: string): string {
  return header
    // Convert camelCase to spaces
    .replace(/([A-Z])/g, ' $1')
    // Convert snake_case to spaces
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Format a value for display in the PDF
 */
function formatValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return JSON.stringify(value);
  }
  
  return String(value);
} 
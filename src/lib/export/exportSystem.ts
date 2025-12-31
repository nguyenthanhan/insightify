export type ExportFormat = "csv" | "json" | "pdf" | "png" | "svg";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  quality?: number;
}

export interface ScheduledExportConfig {
  id: string;
  format: ExportFormat;
  schedule: string; // cron expression
  destination: "download" | "email";
  enabled: boolean;
}

export class ExportSystem {
  private scheduledExports: Map<string, ScheduledExportConfig> = new Map();

  // Export data to CSV
  exportToCSV(
    data: Record<string, unknown>[],
    options?: Partial<ExportOptions>
  ): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => this.escapeCSVValue(row[header])).join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }

  // Export data to JSON
  exportToJSON(data: unknown, options?: Partial<ExportOptions>): string {
    const includeMetadata = options?.includeMetadata ?? true;

    if (includeMetadata) {
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          recordCount: Array.isArray(data) ? data.length : 1,
          data,
        },
        null,
        2
      );
    }

    return JSON.stringify(data, null, 2);
  }

  // Parse CSV back to data
  parseCSV(csv: string): Record<string, string>[] {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      data.push(row);
    }

    return data;
  }

  // Export data as downloadable blob
  async exportData(data: unknown[], options: ExportOptions): Promise<Blob> {
    const filename = options.filename || `export-${Date.now()}`;

    switch (options.format) {
      case "csv":
        const csvContent = this.exportToCSV(data as Record<string, unknown>[]);
        return new Blob([csvContent], { type: "text/csv;charset=utf-8" });

      case "json":
        const jsonContent = this.exportToJSON(data, options);
        return new Blob([jsonContent], { type: "application/json" });

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // Export chart as image
  async exportChart(
    chartElement: HTMLElement,
    options: ExportOptions
  ): Promise<Blob> {
    // For PNG/SVG export, we'd use html2canvas or similar
    // This is a simplified implementation
    if (options.format === "svg") {
      const svgElement = chartElement.querySelector("svg");
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        return new Blob([svgData], { type: "image/svg+xml" });
      }
    }

    // For PNG, we'd need html2canvas
    throw new Error(
      `Chart export to ${options.format} requires additional libraries`
    );
  }

  // Trigger download
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Schedule export
  scheduleExport(config: ScheduledExportConfig): void {
    this.scheduledExports.set(config.id, config);
  }

  // Remove scheduled export
  removeScheduledExport(id: string): boolean {
    return this.scheduledExports.delete(id);
  }

  // Get scheduled exports
  getScheduledExports(): ScheduledExportConfig[] {
    return Array.from(this.scheduledExports.values());
  }

  // Helper: Escape CSV value
  private escapeCSVValue(value: unknown): string {
    if (value === null || value === undefined) return "";

    const stringValue = String(value);

    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (
      stringValue.includes(",") ||
      stringValue.includes("\n") ||
      stringValue.includes('"')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  // Helper: Parse CSV line handling quoted values
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}

// Singleton instance
let exportSystemInstance: ExportSystem | null = null;

export function getExportSystem(): ExportSystem {
  if (!exportSystemInstance) {
    exportSystemInstance = new ExportSystem();
  }
  return exportSystemInstance;
}

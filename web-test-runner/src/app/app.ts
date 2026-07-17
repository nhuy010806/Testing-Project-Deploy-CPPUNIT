import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

export interface TestCase {
  id: any;
  inputs: Record<string, any>;
  expected: string;
}

export interface TestResult {
  id: any;
  inputs: Record<string, any>;
  expected: string;
  actual: string;
  isPass: boolean;
  errorMsg: string;
  execTimeMs: number;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  fileName: string;
  presetName: string;
  totalCases: number;
  passedCases: number;
  passRate: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Signals for configurations
  protected readonly preset = signal<string>('prime');
  protected readonly fileName = signal<string>('');
  protected readonly fileSize = signal<number>(0);
  protected readonly headers = signal<string[]>([]);
  protected readonly csvData = signal<any[]>([]);
  
  protected readonly idColumn = signal<string>('');
  protected readonly expectedColumn = signal<string>('');
  protected readonly inputColumns = signal<string[]>([]);
  
  protected readonly customJsCode = signal<string>(`// Enter your custom test function logic here.
// Inputs are provided in the "inputs" object (e.g. inputs.a, inputs.num).
// Return the expected result (string, number, boolean) or throw an Error.

const { num } = inputs;
if (num < 0 || num > 1000) throw new Error("Out of range [0, 1000]");
if (num <= 1) return "FALSE";
for (let i = 2; i <= Math.sqrt(num); i++) {
  if (num % i === 0) return "FALSE";
}
return "TRUE";`);

  // Execution states
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isRunning = signal<boolean>(false);
  protected readonly testResults = signal<TestResult[]>([]);
  protected readonly executionTimeTotal = signal<number>(0);

  // Filters & Search
  protected readonly searchQuery = signal<string>('');
  protected readonly filterType = signal<'all' | 'pass' | 'fail'>('all');
  protected readonly selectedResult = signal<TestResult | null>(null);

  // Drag over state
  protected readonly isDragOver = signal<boolean>(false);

  // Local Storage History
  protected readonly testHistory = signal<HistoryItem[]>([]);

  constructor() {
    // Automatically load mock data on initialization
    this.loadMockData();

    // Load history from LocalStorage (runs client-side only)
    this.loadHistoryFromLocalStorage();

    // Effect to reload default templates/mock data when preset changes
    effect(() => {
      const currentPreset = this.preset();
      this.loadMockData();
    });
  }

  // Load History from LocalStorage
  private loadHistoryFromLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('uel_test_history');
      if (stored) {
        try {
          this.testHistory.set(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse history from localStorage', e);
        }
      }
    }
  }

  // Clear History
  protected clearHistory() {
    this.testHistory.set([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('uel_test_history');
    }
  }

  // Load Mock Data based on Preset
  protected loadMockData() {
    this.fileName.set('Demo_Mock_Data.csv');
    this.fileSize.set(1024);

    let mockHeaders: string[] = [];
    let mockRows: any[] = [];

    switch (this.preset()) {
      case 'prime':
        mockHeaders = ['id', 'num', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, num: 3, expected: 'TRUE', type: 'N', note: 'So nguyen to le 3' },
          { id: 2, num: 5, expected: 'TRUE', type: 'N', note: 'So nguyen to le 5' },
          { id: 3, num: 4, expected: 'FALSE', type: 'N', note: 'Hop so chan 4' },
          { id: 4, num: 9, expected: 'FALSE', type: 'N', note: 'Hop so le 9' },
          { id: 5, num: -5, expected: 'EXCEPTION', type: 'A', note: 'So am nho hon bien' },
          { id: 6, num: 1005, expected: 'EXCEPTION', type: 'A', note: 'So lon hon bien' },
          { id: 7, num: -1, expected: 'EXCEPTION', type: 'B', note: 'Bien ngoai duoi: -1' },
          { id: 8, num: 0, expected: 'FALSE', type: 'B', note: 'Bien trong duoi: 0' },
          { id: 9, num: 1000, expected: 'FALSE', type: 'B', note: 'Bien trong tren: 1000' },
          { id: 10, num: 1001, expected: 'EXCEPTION', type: 'B', note: 'Bien ngoai tren: 1001' }
        ];
        break;
      case 'leap':
        mockHeaders = ['id', 'year', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, year: 2000, expected: 'TRUE', type: 'N', note: 'Chia het cho 400' },
          { id: 2, year: 2004, expected: 'TRUE', type: 'N', note: 'Chia het cho 4 nhung khong cho 100' },
          { id: 3, year: 1900, expected: 'FALSE', type: 'N', note: 'Chia het cho 100 nhung khong cho 400' },
          { id: 4, year: 2023, expected: 'FALSE', type: 'N', note: 'Nam thuong khong chia het cho 4' },
          { id: 5, year: 2021, expected: 'FALSE', type: 'N', note: 'Nam thuong le' },
          { id: 6, year: -100, expected: 'EXCEPTION', type: 'A', note: 'Nam am' },
          { id: 7, year: 1000, expected: 'EXCEPTION', type: 'A', note: 'Nam nho hon 1582' },
          { id: 8, year: 1581, expected: 'EXCEPTION', type: 'B', note: 'Bien ngoai duoi: 1581' },
          { id: 9, year: 1582, expected: 'FALSE', type: 'B', note: 'Bien trong duoi: 1582' },
          { id: 10, year: 1584, expected: 'TRUE', type: 'B', note: 'Bien nam nhuan dau tien: 1584' }
        ];
        break;
      case 'bintodec':
        mockHeaders = ['id', 'bin', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, bin: '101', expected: '5', type: 'N', note: 'Nhi phan thong thuong' },
          { id: 2, bin: '0', expected: '0', type: 'N', note: 'Nhi phan 0' },
          { id: 3, bin: '1111', expected: '15', type: 'N', note: 'Nhi phan toan 1' },
          { id: 4, bin: '1010', expected: '10', type: 'N', note: 'Nhi phan chan' },
          { id: 5, bin: '102', expected: 'EXCEPTION', type: 'A', note: 'Chua ky tu la 2' },
          { id: 6, bin: 'abc', expected: 'EXCEPTION', type: 'A', note: 'Chua chu cai' },
          { id: 7, bin: '', expected: 'EXCEPTION', type: 'A', note: 'Chuoi rong' },
          { id: 8, bin: '1', expected: '1', type: 'B', note: 'Bien nho nhat: 1' },
          { id: 9, bin: '00000', expected: '0', type: 'B', note: 'Nhieu so 0 dung dau' },
          { id: 10, bin: '1111111111111111', expected: '65535', type: 'B', note: 'Bien lon 16 bits' }
        ];
        break;
      case 'triangle':
        mockHeaders = ['id', 'sideA', 'sideB', 'sideC', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, sideA: 3, sideB: 3, sideC: 3, expected: 'EQUILATERAL', type: 'N', note: 'Tam giac deu' },
          { id: 2, sideA: 3, sideB: 3, sideC: 4, expected: 'ISOSCELES', type: 'N', note: 'Tam giac can' },
          { id: 3, sideA: 3, sideB: 4, sideC: 5, expected: 'SCALENE', type: 'N', note: 'Tam giac thuong' },
          { id: 4, sideA: 1, sideB: 2, sideC: 4, expected: 'NOT A TRIANGLE', type: 'N', note: 'Khong phai tam giac' },
          { id: 5, sideA: 10, sideB: 2, sideC: 3, expected: 'NOT A TRIANGLE', type: 'N', note: 'Mot canh qua lon' },
          { id: 6, sideA: 1, sideB: 1, sideC: 3, expected: 'NOT A TRIANGLE', type: 'N', note: 'Tong hai canh be hon canh ba' },
          { id: 7, sideA: -1, sideB: 3, sideC: 4, expected: 'EXCEPTION', type: 'A', note: 'Canh am' },
          { id: 8, sideA: 0, sideB: 3, sideC: 4, expected: 'EXCEPTION', type: 'A', note: 'Canh bang 0' },
          { id: 9, sideA: 2, sideB: 3, sideC: 5, expected: 'NOT A TRIANGLE', type: 'B', note: 'Bien cham: a+b=c' },
          { id: 10, sideA: 2, sideB: 5, sideC: 3, expected: 'NOT A TRIANGLE', type: 'B', note: 'Bien cham: a+c=b' }
        ];
        break;
      case 'huychuoi':
        mockHeaders = ['id', 's', 'n', 'p', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, s: 'HELLO', n: 2, p: 1, expected: 'HLO', type: 'N', note: 'Xoa 2 ky tu o giua' },
          { id: 2, s: 'ABCDEF', n: 3, p: 0, expected: 'DEF', type: 'N', note: 'Xoa 3 ky tu o dau' },
          { id: 3, s: 'TEST', n: 1, p: 3, expected: 'TES', type: 'N', note: 'Xoa 1 ky tu cuoi' },
          { id: 4, s: 'PROGRAMMING', n: 5, p: 3, expected: 'PROING', type: 'N', note: 'Xoa 5 ky tu o giua' },
          { id: 5, s: 'HELLO', n: 2, p: -1, expected: 'EXCEPTION', type: 'A', note: 'Vi tri p am' },
          { id: 6, s: 'HELLO', n: 2, p: 5, expected: 'EXCEPTION', type: 'A', note: 'Vi tri p vuot qua s-1' },
          { id: 7, s: '', n: 1, p: 0, expected: 'EXCEPTION', type: 'A', note: 'Chuoi s rong' },
          { id: 8, s: 'A', n: 1, p: 0, expected: '', type: 'B', note: 'Xoa ky tu duy nhat' },
          { id: 9, s: 'HELLO', n: 0, p: 2, expected: 'HELLO', type: 'B', note: 'Xoa n=0 ky tu' },
          { id: 10, s: 'HELLO', n: 10, p: 2, expected: 'HE', type: 'B', note: 'Xoa vuot qua ky tu con lai' }
        ];
        break;
      case 'thaythe':
        mockHeaders = ['id', 's1', 's2', 's3', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, s1: 'hello world', s2: 'world', s3: 'angular', expected: 'hello angular', type: 'N', note: 'Thay the 1 tu o cuoi' },
          { id: 2, s1: 'apple banana apple', s2: 'apple', s3: 'orange', expected: 'orange banana orange', type: 'N', note: 'Thay the nhieu cho' },
          { id: 3, s1: 'aaa', s2: 'a', s3: 'b', expected: 'bbb', type: 'N', note: 'Thay the ky tu don' },
          { id: 4, s1: 'hello', s2: 'nomatch', s3: 'xyz', expected: 'hello', type: 'N', note: 'Khong tim thay s2' },
          { id: 5, s1: 'test', s2: 'test', s3: 'new', expected: 'new', type: 'N', note: 'Thay the bang chuoi khac' },
          { id: 6, s1: 'hello world', s2: ' ', s3: '-', expected: 'hello-world', type: 'N', note: 'Thay the khoang trang' },
          { id: 7, s1: '', s2: 'a', s3: 'b', expected: '', type: 'B', note: 's1 la chuoi rong' },
          { id: 8, s1: 'abc', s2: '', s3: 'x', expected: 'abc', type: 'B', note: 's2 la chuoi rong' },
          { id: 9, s1: 'abc', s2: 'abc', s3: 'xyz', expected: 'xyz', type: 'B', note: 's2 bang dung s1' },
          { id: 10, s1: 'a', s2: 'a', s3: 'a', expected: 'a', type: 'B', note: 'Cac chuoi giong nhau' }
        ];
        break;
      case 'tinhtiendien':
        mockHeaders = ['id', 'chiSoCu', 'chiSoMoi', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, chiSoCu: 100, chiSoMoi: 140, expected: '73832', type: 'N', note: 'Tieu thu 40 kWh (Bac 1). VAT 10%' },
          { id: 2, chiSoCu: 100, chiSoMoi: 180, expected: '149512', type: 'N', note: 'Tieu thu 80 kWh (Bac 2). VAT 10%' },
          { id: 3, chiSoCu: 200, chiSoMoi: 350, expected: '298430', type: 'N', note: 'Tieu thu 150 kWh (Bac 3). VAT 10%' },
          { id: 4, chiSoCu: 0, chiSoMoi: 250, expected: '548680', type: 'N', note: 'Tieu thu 250 kWh (Bac 4). VAT 10%' },
          { id: 5, chiSoCu: 150, chiSoMoi: 100, expected: '-1', type: 'A', note: 'Chi so cu lon hon chi so moi' },
          { id: 6, chiSoCu: -10, chiSoMoi: 100, expected: '-1', type: 'A', note: 'Chi so cu am' },
          { id: 7, chiSoCu: 0, chiSoMoi: 0, expected: '0', type: 'B', note: 'Tieu thu dung 0 kWh' },
          { id: 8, chiSoCu: 100, chiSoMoi: 150, expected: '92290', type: 'B', note: 'Tieu thu dung 50 kWh (Bien Bac 1)' },
          { id: 9, chiSoCu: 100, chiSoMoi: 200, expected: '187660', type: 'B', note: 'Tieu thu dung 100 kWh (Bien Bac 2)' },
          { id: 10, chiSoCu: 100, chiSoMoi: 90, expected: '-1', type: 'B', note: 'Chi so moi am so voi chi so cu' }
        ];
        break;
      case 'solvequadratic':
        mockHeaders = ['id', 'a', 'b', 'c', 'expected', 'type', 'note'];
        mockRows = [
          { id: 1, a: 1, b: -3, c: 2, expected: 'Có 2 nghiệm phân biệt', type: 'N', note: 'Hai nghiem phan biet x1=1 x2=2' },
          { id: 2, a: 1, b: -2, c: 1, expected: 'Có 2 nghiệm kép', type: 'N', note: 'Nghiem kep x=1' },
          { id: 3, a: 1, b: 2, c: 3, expected: 'Vô nghiệm', type: 'N', note: 'Delta < 0' },
          { id: 4, a: 0, b: 2, c: -4, expected: 'Có 1 nghiệm', type: 'N', note: 'Phuong trinh bac nhat x=2' },
          { id: 5, a: 0, b: 0, c: 0, expected: 'Vô số nghiệm', type: 'N', note: 'Vo so nghiem 0x=0' },
          { id: 6, a: 0, b: 0, c: 5, expected: 'Vô nghiệm', type: 'N', note: 'Vo nghiem 0x=5' },
          { id: 7, a: 1, b: 0, c: -4, expected: 'Có 2 nghiệm phân biệt', type: 'B', note: 'Khuyet b delta > 0' },
          { id: 8, a: 1, b: 0, c: 0, expected: 'Có 2 nghiệm kép', type: 'B', note: 'Khuyet b va c nghiem x=0' },
          { id: 9, a: 1, b: 0, c: 4, expected: 'Vô nghiệm', type: 'B', note: 'Khuyet b delta < 0' },
          { id: 10, a: 1, b: -4, c: 4, expected: 'Có 2 nghiệm kép', type: 'B', note: 'Nghiem kep x=2' }
        ];
        break;
      case 'custom':
        mockHeaders = ['id', 'text', 'expected'];
        mockRows = [
          { id: 1, text: 'hello', expected: 'OLLEH' },
          { id: 2, text: 'angular', expected: 'RALUGNA' },
          { id: 3, text: '', expected: 'EXCEPTION' }
        ];
        this.customJsCode.set(`// Dynamic String Reverser
// Inputs are accessible via inputs.text
const { text } = inputs;
if (!text || text.length === 0) {
  throw new Error("Empty text");
}
return text.split('').reverse().join('').toUpperCase();`);
        break;
    }

    this.headers.set(mockHeaders);
    this.csvData.set(mockRows);
    
    // Default Map
    this.idColumn.set(mockHeaders[0]);
    this.expectedColumn.set('expected');
    this.inputColumns.set(mockHeaders.filter(h => h !== mockHeaders[0] && h !== 'expected' && h !== 'type' && h !== 'note'));
    
    // Clear old test results
    this.testResults.set([]);
    this.executionTimeTotal.set(0);
  }

  // Handle preset change
  protected onPresetChange(event: any) {
    this.preset.set(event.target.value);
  }

  // File Upload Handlers
  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave() {
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.parseFile(event.dataTransfer.files[0]);
    }
  }

  protected onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.parseFile(event.target.files[0]);
    }
  }

  protected removeFile() {
    this.fileName.set('');
    this.fileSize.set(0);
    this.headers.set([]);
    this.csvData.set([]);
    this.testResults.set([]);
    this.executionTimeTotal.set(0);
  }

  private parseFile(file: File) {
    this.isLoading.set(true);
    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length > 0) {
          this.csvData.set(json);
          const hdrs = Object.keys(json[0]);
          this.headers.set(hdrs);

          // Smart auto-mapping
          const idCol = hdrs.find(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'stt') || hdrs[0];
          const expCol = hdrs.find(h => h.toLowerCase() === 'expected' || h.toLowerCase() === 'output' || h.toLowerCase() === 'ketqua') || hdrs[hdrs.length - 1];
          
          this.idColumn.set(idCol);
          this.expectedColumn.set(expCol);
          this.inputColumns.set(hdrs.filter(h => h !== idCol && h !== expCol && h !== 'type' && h !== 'note'));
          
          this.testResults.set([]);
          this.executionTimeTotal.set(0);
        } else {
          alert('Tệp dữ liệu rỗng!');
          this.removeFile();
        }
      } catch (err: any) {
        alert('Có lỗi xảy ra khi đọc tệp: ' + err.message);
        this.removeFile();
      } finally {
        this.isLoading.set(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Toggle Input Column mapping
  protected toggleInputColumn(col: string) {
    const current = this.inputColumns();
    if (current.includes(col)) {
      this.inputColumns.set(current.filter(c => c !== col));
    } else {
      this.inputColumns.set([...current, col]);
    }
  }

  // Run Test Suite
  protected runTests() {
    if (this.csvData().length === 0) return;

    this.isRunning.set(true);
    const startOverall = performance.now();

    const results: TestResult[] = [];
    const rows = this.csvData();
    const idColName = this.idColumn();
    const expColName = this.expectedColumn();
    const inputColNames = this.inputColumns();
    const currentPreset = this.preset();
    const customJs = this.customJsCode();

    // Loop through each test case
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const id = row[idColName] ?? index + 1;
      const expectedRaw = String(row[expColName] ?? '').trim();

      // Extract dynamic input parameters
      const inputs: Record<string, any> = {};
      inputColNames.forEach(col => {
        inputs[col] = row[col];
      });

      let actual = '';
      let errorMsg = '';
      const startCell = performance.now();

      try {
        if (currentPreset === 'prime') {
          const firstKey = Object.keys(inputs)[0];
          const val = inputs[firstKey];
          if (val === undefined || val === '') throw new Error('Thiếu giá trị đầu vào');
          const num = Number(val);
          if (isNaN(num)) throw new Error('Đầu vào không phải là số hợp lệ');
          actual = this.primeCheck(num) ? 'TRUE' : 'FALSE';

        } else if (currentPreset === 'leap') {
          const firstKey = Object.keys(inputs)[0];
          const val = inputs[firstKey];
          if (val === undefined || val === '') throw new Error('Thiếu giá trị đầu vào');
          const year = Number(val);
          if (isNaN(year)) throw new Error('Năm nhập vào không phải là số');
          actual = this.isLeapYear(year) ? 'TRUE' : 'FALSE';

        } else if (currentPreset === 'bintodec') {
          const firstKey = Object.keys(inputs)[0];
          const bin = String(inputs[firstKey] ?? '');
          actual = this.binToDec(bin);

        } else if (currentPreset === 'triangle') {
          const keys = Object.keys(inputs);
          const a = Number(inputs['sideA'] ?? inputs[keys[0]] ?? 0);
          const b = Number(inputs['sideB'] ?? inputs[keys[1]] ?? 0);
          const c = Number(inputs['sideC'] ?? inputs[keys[2]] ?? 0);
          if (isNaN(a) || isNaN(b) || isNaN(c)) throw new Error('Các cạnh tam giác phải là số');
          actual = this.classifyTriangle(a, b, c);

        } else if (currentPreset === 'huychuoi') {
          const keys = Object.keys(inputs);
          const s = String(inputs['s'] ?? inputs[keys[0]] ?? '');
          const n = Number(inputs['n'] ?? inputs[keys[1]] ?? 0);
          const p = Number(inputs['p'] ?? inputs[keys[2]] ?? 0);
          if (isNaN(n) || isNaN(p)) throw new Error('Tham số n và p phải là số');
          actual = this.huyChuoi(s, n, p);

        } else if (currentPreset === 'thaythe') {
          const keys = Object.keys(inputs);
          const s1 = String(inputs['s1'] ?? inputs[keys[0]] ?? '');
          const s2 = String(inputs['s2'] ?? inputs[keys[1]] ?? '');
          const s3 = String(inputs['s3'] ?? inputs[keys[2]] ?? '');
          actual = this.thayThe(s1, s2, s3);

        } else if (currentPreset === 'tinhtiendien') {
          const keys = Object.keys(inputs);
          const chiSoCu = Number(inputs['chiSoCu'] ?? inputs[keys[0]] ?? 0);
          const chiSoMoi = Number(inputs['chiSoMoi'] ?? inputs[keys[1]] ?? 0);
          if (isNaN(chiSoCu) || isNaN(chiSoMoi)) throw new Error('Chỉ số phải là số');
          actual = this.tinhTienDien(chiSoCu, chiSoMoi).toString();

        } else if (currentPreset === 'solvequadratic') {
          const keys = Object.keys(inputs);
          const a = Number(inputs['a'] ?? inputs[keys[0]] ?? 0);
          const b = Number(inputs['b'] ?? inputs[keys[1]] ?? 0);
          const c = Number(inputs['c'] ?? inputs[keys[2]] ?? 0);
          if (isNaN(a) || isNaN(b) || isNaN(c)) throw new Error('Hệ số phải là số');
          actual = this.solveQuadraticText(a, b, c);

        } else {
          // Custom JavaScript Runner
          const runnerFn = new Function('inputs', customJs);
          const result = runnerFn(inputs);
          actual = result !== undefined ? String(result).trim() : 'UNDEFINED';
        }
      } catch (err: any) {
        actual = 'EXCEPTION';
        errorMsg = err.message || 'Lỗi không xác định';
      }

      const endCell = performance.now();
      const cellTime = endCell - startCell;

      // Normalization comparison logic
      const normExpected = expectedRaw.toUpperCase();
      const normActual = actual.toUpperCase();

      const isExpectedException = normExpected === 'EXCEPTION' || normExpected.startsWith('EXCEP') || normExpected === 'ERROR';
      const isActualException = normActual === 'EXCEPTION';

      let isPass = false;
      if (isExpectedException && isActualException) {
        isPass = true;
      } else {
        isPass = normExpected === normActual;
      }

      results.push({
        id,
        inputs,
        expected: expectedRaw,
        actual,
        isPass,
        errorMsg,
        execTimeMs: cellTime
      });
    }

    const endOverall = performance.now();
    const overallTime = endOverall - startOverall;
    this.executionTimeTotal.set(overallTime);
    this.testResults.set(results);
    this.isRunning.set(false);

    // Save this run to local storage history
    this.saveRunToHistory(overallTime, results);
  }

  // Save to history
  private saveRunToHistory(timeMs: number, results: TestResult[]) {
    const passed = results.filter(r => r.isPass).length;
    const rate = results.length > 0 ? Math.round((passed / results.length) * 1000) / 10 : 0;
    
    const newRun: HistoryItem = {
      id: 'run_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      fileName: this.fileName() || 'Mock_Data.csv',
      presetName: this.getPresetLabel(this.preset()),
      totalCases: results.length,
      passedCases: passed,
      passRate: rate
    };

    const updatedHistory = [newRun, ...this.testHistory().slice(0, 9)]; // Keep last 10
    this.testHistory.set(updatedHistory);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('uel_test_history', JSON.stringify(updatedHistory));
    }
  }

  // Export results to Excel
  protected exportResults() {
    if (this.testResults().length === 0) return;

    const dataToExport = this.testResults().map(res => {
      const rowData: Record<string, any> = {
        'Test Case ID': res.id,
      };
      
      // Dynamic inputs flattening
      Object.keys(res.inputs).forEach(key => {
        rowData[`Input: ${key}`] = res.inputs[key];
      });
      
      rowData['Expected Result'] = res.expected;
      rowData['Actual Result'] = res.actual;
      rowData['Status'] = res.isPass ? 'PASS' : 'FAIL';
      rowData['Error Message'] = res.errorMsg || 'None';
      rowData['Execution Time (ms)'] = Number(res.execTimeMs.toFixed(3));
      
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Results');
    XLSX.writeFile(workbook, `Test_Results_${this.getPresetLabel(this.preset())}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  private getPresetLabel(preset: string): string {
    switch (preset) {
      case 'prime': return 'primeCheck';
      case 'leap': return 'IsLeapYear';
      case 'bintodec': return 'BinToDec';
      case 'triangle': return 'Triangle';
      case 'huychuoi': return 'HuyChuoi';
      case 'thaythe': return 'ThayThe';
      case 'tinhtiendien': return 'TinhTienDien';
      case 'solvequadratic': return 'SolveQuadratic';
      default: return 'Custom';
    }
  }

  // Pre-built Algorithms
  private primeCheck(num: number): boolean {
    if (num < 0 || num > 1000) {
      throw new Error('num phải nằm trong khoảng [0, 1000]');
    }
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  private isLeapYear(year: number): boolean {
    if (year < 1582) {
      throw new Error('Năm kiểm tra phải >= 1582');
    }
    return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
  }

  private binToDec(bin: string): string {
    const cleanBin = String(bin).trim();
    if (cleanBin === '') {
      throw new Error('Chuỗi nhị phân không được rỗng');
    }
    for (let i = 0; i < cleanBin.length; i++) {
      if (cleanBin[i] !== '0' && cleanBin[i] !== '1') {
        throw new Error('Chuỗi chứa ký tự không hợp lệ, chỉ chấp nhận 0 và 1');
      }
    }
    return parseInt(cleanBin, 2).toString();
  }

  private classifyTriangle(a: number, b: number, c: number): string {
    if (a <= 0 || b <= 0 || c <= 0) {
      throw new Error('Các cạnh của tam giác phải lớn hơn 0');
    }
    if (a + b <= c || a + c <= b || b + c <= a) {
      return 'NOT A TRIANGLE';
    }
    if (a === b && b === c) return 'EQUILATERAL';
    if (a === b || b === c || a === c) return 'ISOSCELES';
    return 'SCALENE';
  }

  private huyChuoi(s: string, n: number, p: number): string {
    if (s === '') {
      throw new Error('Chuỗi rỗng');
    }
    if (p < 0 || p >= s.length) {
      throw new Error('Vị trí p ngoài phạm vi');
    }
    if (n < 0) {
      throw new Error('Số lượng n không được âm');
    }
    return s.substring(0, p) + s.substring(p + n);
  }

  private thayThe(s1: string, s2: string, s3: string): string {
    if (s1 === '') return '';
    if (s2 === '') return s1;
    return s1.replaceAll(s2, s3);
  }

  private tinhTienDien(chiSoCu: number, chiSoMoi: number): number {
    if (chiSoCu < 0 || chiSoMoi < 0 || chiSoCu > chiSoMoi) {
      return -1;
    }
    const consumed = chiSoMoi - chiSoCu;
    let price = 0;
    
    if (consumed <= 50) {
      price = consumed * 1678;
    } else if (consumed <= 100) {
      price = 50 * 1678 + (consumed - 50) * 1734;
    } else if (consumed <= 200) {
      price = 50 * 1678 + 50 * 1734 + (consumed - 100) * 2014;
    } else if (consumed <= 300) {
      price = 50 * 1678 + 50 * 1734 + 100 * 2014 + (consumed - 200) * 2536;
    } else if (consumed <= 400) {
      price = 50 * 1678 + 50 * 1734 + 100 * 2014 + 100 * 2536 + (consumed - 300) * 2834;
    } else {
      price = 50 * 1678 + 50 * 1734 + 100 * 2014 + 100 * 2536 + 100 * 2834 + (consumed - 400) * 2927;
    }
    
    const total = price * 1.1;
    return Math.round(total);
  }

  private solveQuadraticText(a: number, b: number, c: number): string {
    if (a === 0) {
      if (b === 0) {
        if (c === 0) return 'Vô số nghiệm';
        return 'Vô nghiệm';
      }
      return 'Có 1 nghiệm';
    }
    const delta = b * b - 4 * a * c;
    if (delta < 0) {
      return 'Vô nghiệm';
    } else if (delta === 0) {
      return 'Có 2 nghiệm kép';
    } else {
      return 'Có 2 nghiệm phân biệt';
    }
  }

  // Dashboard Stats (signals computed)
  protected readonly totalCount = computed(() => this.testResults().length);
  protected readonly passedCount = computed(() => this.testResults().filter(r => r.isPass).length);
  protected readonly failedCount = computed(() => this.testResults().filter(r => !r.isPass).length);
  protected readonly passRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.passedCount() / total) * 1000) / 10;
  });

  // Filtered & Searched Results
  protected readonly filteredResults = computed(() => {
    let results = this.testResults();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.filterType();

    if (filter === 'pass') {
      results = results.filter(r => r.isPass);
    } else if (filter === 'fail') {
      results = results.filter(r => !r.isPass);
    }

    if (query) {
      results = results.filter(r => {
        const idMatch = String(r.id).toLowerCase().includes(query);
        const expMatch = String(r.expected).toLowerCase().includes(query);
        const actMatch = String(r.actual).toLowerCase().includes(query);
        const inputMatch = Object.values(r.inputs).some(v => String(v).toLowerCase().includes(query));
        return idMatch || expMatch || actMatch || inputMatch;
      });
    }

    return results;
  });

  // Result Selection for detail modal
  protected openDetail(result: TestResult) {
    this.selectedResult.set(result);
  }

  protected closeDetail() {
    this.selectedResult.set(null);
  }

  // Helper to format memory / byte sizes
  protected formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper to stringify input objects for table view
  protected getInputKeys(inputs: Record<string, any>): string[] {
    return Object.keys(inputs);
  }
}

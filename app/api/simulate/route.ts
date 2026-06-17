import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto'; // Added for concurrency safety

// Promisify execFile instead of exec for security
const execFileAsync = promisify(execFile);

/**
 * Robust CSV parser that handles commas inside double-quoted fields.
 */
function parseCSV(csvString: string): Array<Record<string, string>> {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const results: Array<Record<string, string>> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j] !== undefined ? values[j] : '';
      obj[headers[j]] = val.replace(/^"|"$/g, '').trim();
    }
    results.push(obj);
  }
  return results;
}

export async function POST(request: Request) {
  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, 'data');
  
  // FIX 1: Generate unique file names to handle concurrent API requests safely
  const reqId = randomUUID();
  const tempInputPath = path.join(dataDir, `temp_input_${reqId}.json`);
  const tempOutputPath = path.join(dataDir, `temp_output_${reqId}.csv`);
  
  try {
    const payload = await request.json();
    
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(tempInputPath, JSON.stringify(payload, null, 2), 'utf8');
    
    // FIX 2: Use execFileAsync with array arguments to prevent Shell Injection Attacks
    const scriptPath = path.join(projectRoot, 'src', 'predict.py');
    
    await execFileAsync('python', [
      scriptPath,
      '--input', tempInputPath,
      '--output', tempOutputPath
    ], { cwd: projectRoot });

    const csvData = await fs.readFile(tempOutputPath, 'utf8');
    const parsedData = parseCSV(csvData);
    
    return NextResponse.json(parsedData);
    
  } catch (error: any) {
    console.error(`[ReqID: ${reqId}] IPC Simulation failed:`, error);
    return NextResponse.json(
      { error: 'Simulation execution failed', details: error.message || String(error) },
      { status: 500 }
    );
  } finally {
    // Cleanup using Promise.allSettled so one failure doesn't block the other
    await Promise.allSettled([
      fs.unlink(tempInputPath),
      fs.unlink(tempOutputPath)
    ]);
  }
}
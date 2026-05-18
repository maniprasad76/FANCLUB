import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  private readonly file = path.join(process.cwd(), 'data', 'settings.json');

  private getSettings(): Record<string, any> {
    if (!fs.existsSync(this.file)) return {};
    return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
  }

  getSetting(key: string): any {
    const settings = this.getSettings();
    return settings[key] || null;
  }

  setSetting(key: string, value: any): void {
    const settings = this.getSettings();
    settings[key] = value;
    
    // Ensure dir exists
    if (!fs.existsSync(path.dirname(this.file))) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
    }
    fs.writeFileSync(this.file, JSON.stringify(settings, null, 2));
  }

  deleteSetting(key: string): void {
    const settings = this.getSettings();
    delete settings[key];
    if (!fs.existsSync(path.dirname(this.file))) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
    }
    fs.writeFileSync(this.file, JSON.stringify(settings, null, 2));
  }
}

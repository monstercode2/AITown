/**
 * 日志分类枚举
 * 用于区分不同类型的日志
 */
export enum LogCategory {
  SYSTEM = 'SYSTEM',       // 系统级别日志
  AGENT = 'AGENT',         // Agent相关日志
  EVENT = 'EVENT',         // 事件相关日志
  LLM = 'LLM',             // LLM调用相关日志
  API = 'API',             // API调用相关日志
  UI = 'UI',               // UI相关日志
  DEBUG = 'DEBUG',         // 调试信息
  TEST = 'TEST'            // 测试相关日志
}

/**
 * 日志级别枚举
 * 用于区分不同级别的日志
 */
export enum LogLevel {
  DEBUG = 0,               // 调试信息
  INFO = 1,                // 一般信息
  WARN = 2,                // 警告信息
  ERROR = 3,               // 错误信息
}

/**
 * 记录器配置
 */
interface LoggerConfig {
  minLevel: LogLevel;      // 最小记录级别
  console: boolean;        // 是否输出到控制台
  storage: boolean;        // 是否保存到本地存储
  maxEntries: number;      // 最大日志条目数
  categories: LogCategory[]; // 要记录的日志分类
}

/**
 * 日志条目接口
 */
interface LogEntry {
  timestamp: number;       // 时间戳
  level: LogLevel;         // 日志级别
  category: LogCategory;   // 日志分类
  message: string;         // 日志消息
  data?: any;              // 附加数据
}

/**
 * 日志工具类
 * 用于记录应用程序中的各种日志信息
 */
export class Logger {
  private static config: LoggerConfig = {
    minLevel: LogLevel.INFO,
    console: true,
    storage: true,
    maxEntries: 1000,
    categories: Object.values(LogCategory)
  };

  private static logs: LogEntry[] = [];

  /**
   * 配置记录器
   * @param config 配置选项
   */
  public static configure(config: Partial<LoggerConfig>): void {
    Logger.config = { ...Logger.config, ...config };
  }

  /**
   * 记录调试信息
   * @param category 日志分类
   * @param message 日志消息
   * @param data 附加数据
   */
  public static debug(category: LogCategory, message: string, data?: any): void {
    Logger.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * 记录一般信息
   * @param category 日志分类
   * @param message 日志消息
   * @param data 附加数据
   */
  public static info(category: LogCategory, message: string, data?: any): void {
    Logger.log(LogLevel.INFO, category, message, data);
  }

  /**
   * 记录警告信息
   * @param category 日志分类
   * @param message 日志消息
   * @param data 附加数据
   */
  public static warn(category: LogCategory, message: string, data?: any): void {
    Logger.log(LogLevel.WARN, category, message, data);
  }

  /**
   * 记录错误信息
   * @param category 日志分类
   * @param message 日志消息
   * @param data 附加数据
   */
  public static error(category: LogCategory, message: string, data?: any): void {
    Logger.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param category 日志分类
   * @param message 日志消息
   * @param data 附加数据
   */
  private static log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    // 检查是否需要记录此类别和级别的日志
    if (level < Logger.config.minLevel || !Logger.config.categories.includes(category)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };

    // 添加到日志数组
    Logger.logs.push(entry);
    
    // 如果超过最大条目数，删除最旧的条目
    if (Logger.logs.length > Logger.config.maxEntries) {
      Logger.logs.shift();
    }

    // 是否输出到控制台
    if (Logger.config.console) {
      Logger.logToConsole(entry);
    }

    // 是否保存到本地存储
    if (Logger.config.storage) {
      Logger.saveToStorage();
    }
  }

  /**
   * 输出日志到控制台
   * @param entry 日志条目
   */
  private static logToConsole(entry: LogEntry): void {
    const prefix = `[${new Date(entry.timestamp).toISOString()}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, entry.data || '');
        break;
    }
  }

  /**
   * 保存日志到本地存储
   */
  private static saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_town_logs', JSON.stringify(Logger.logs));
      }
    } catch (error) {
      console.error('保存日志到本地存储失败:', error);
    }
  }

  /**
   * 获取所有日志
   * @returns 日志数组
   */
  public static getLogs(): LogEntry[] {
    return [...Logger.logs];
  }

  /**
   * 获取特定类别的日志
   * @param category 日志分类
   * @returns 日志数组
   */
  public static getLogsByCategory(category: LogCategory): LogEntry[] {
    return Logger.logs.filter(log => log.category === category);
  }

  /**
   * 获取特定级别的日志
   * @param level 日志级别
   * @returns 日志数组
   */
  public static getLogsByLevel(level: LogLevel): LogEntry[] {
    return Logger.logs.filter(log => log.level === level);
  }

  /**
   * 清除所有日志
   */
  public static clearLogs(): void {
    Logger.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_town_logs');
    }
  }
} 
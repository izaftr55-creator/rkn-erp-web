declare module 'xlsx' {
  export function read(data: any, opts?: any): any;
  export namespace utils {
    function sheet_to_json<T = any>(sheet: any, opts?: any): T[];
    function json_to_sheet<T = any>(data: T[], opts?: any): any;
  }
  export function write(wb: any, opts?: any): any;
}
declare module 'jszip' { const x: any; export default x; }

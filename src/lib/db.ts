export function getDB(context: any) {
  return (context.locals as any).runtime.env.DB;
}

export function getUploads(context: any) {
  return (context.locals as any).runtime.env.UPLOADS;
}
